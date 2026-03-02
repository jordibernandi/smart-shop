import { NextFunction, Request, Response } from "express";
import { checkOtpRestrictions, handleForgotPassword, sendOtp, trackOtpRequests, validationRegistrationData, verifyForgotPasswordOTP, verifyOtp } from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover"
})

// Register a new user
export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        validationRegistrationData(req.body, "user");

        const { name, email } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return next(new ValidationError("User already exists with this email!"));
        }

        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);
        await sendOtp(name, email, "user-activation-mail");

        res.status(200).json({
            message: "OTP sent to email. Please verify your account."
        });
    } catch (error) {
        return next(error);
    }
}

// Verify user with otp
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp, password, name } = req.body;
        if (!email || !otp || !password || !name) {
            return next(new ValidationError("All fields are required!"));
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return next(new ValidationError("User already exists with this email!"));
        };

        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: { name, email, password: hashedPassword },
        })

        res.status(201).json({
            success: true,
            message: "User registered successfully!"
        });
    } catch (error) {
        return next(error);
    }
}

// Login user
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ValidationError("Email and password are required!"));
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return next(new AuthError("User doesn't exists!"));

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password!)
        if (!isMatch) {
            return next(new AuthError("Invalid email or password!"));
        }

        // Generate access and refresh token
        const accessToken = jwt.sign({ id: user.id, role: "user" }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user.id, role: "user" }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });

        // Store the refresh and access token in an httpOnly secure cookie
        setCookie(res, "access_token", accessToken);
        setCookie(res, "refresh_token", refreshToken);

        res.status(200).json({
            message: "Login successful!",
            user: { id: user.id, email: user.email, name: user.name },
        })
    } catch (error) {
        return next(error);
    }
}

// Refresh token user
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
            return next(new ValidationError("Unauthorized! No refresh token."));
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as { id: string; role: string };

        if (!decoded || !decoded.id || !decoded.role) {
            return new JsonWebTokenError("Forbidden! Invalid refresh token.");
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return new AuthError("Forbidden! User/Seller not found.");
        }

        const newAccessToken = jwt.sign(
            { id: decoded.id, role: decoded.role },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: "15m" }
        );

        setCookie(res, "access_token", newAccessToken);
        return res.status(201).json({ success: true });
    } catch (error) {
        return next(error);
    }
}

// Get logged in user
export const getUser = async (req: any, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        res.status(201).json({
            success: true,
            user
        });
    } catch (error) {
        return next(error);
    }
};

// User forgot password
export const userForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    await handleForgotPassword(req, res, next, "user")
}

// Verify forgot password OTP
export const verifyUserForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    await verifyForgotPasswordOTP(req, res, next);
}

// Reset user password
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword)
            return next(new ValidationError("Email and new password are required!"));

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return next(new ValidationError("User not found!"));

        // Compare new password with the existing one
        const isSamePassword = await bcrypt.compare(newPassword, user.password!);

        if (isSamePassword) {
            return next(new ValidationError("New password cannot be the same as the old password!"));
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password reset successfully!" })
    } catch (error) {
        return next(error)
    }
}

// Register a new seller
export const sellerRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        validationRegistrationData(req.body, "seller");

        const { name, email } = req.body;

        const existingSeller = await prisma.seller.findUnique({
            where: { email }
        })

        if (existingSeller) {
            return next(new ValidationError("Seller already exists with this email!"));
        };

        await checkOtpRestrictions(email, next);
        await trackOtpRequests(email, next);
        await sendOtp(name, email, "seller-activation-mail");

        res.status(200).json({
            message: "OTP sent to email. Please verify your account."
        });
    } catch (error) {
        return next(error);
    }
}

// Verify seller with otp
export const verifySeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp, password, name, phoneNumber, country } = req.body;
        console.log("Body verify seller: ", req.body)
        if (!email || !otp || !password || !name || !phoneNumber || !country) {
            return next(new ValidationError("All fields are required!"));
        }

        const existingSeller = await prisma.seller.findUnique({ where: { email } });

        if (existingSeller) {
            return next(new ValidationError("User already exists with this email!"));
        };

        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);

        const newSeller = await prisma.seller.create({
            data: { name, email, password: hashedPassword, phoneNumber, country },
        });

        res.status(201).json({
            success: true,
            message: "Seller registered successfully!",
            sellerId: newSeller.id
        });
    } catch (error) {
        return next(error);
    }
}

// Create a new shop
export const createShop = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, bio, address, openingHours, website, category, sellerId } = req.body;
        console.log("Create shop: ", req.body)
        if (!name || !bio || !address || !openingHours || !website || !category || !sellerId) {
            return next(new ValidationError("All fields are required!"));
        }

        const shopData: any = {
            name, bio, address, openingHours, category, sellerId
        };

        if (website && website.trim() !== "") {
            shopData.website = website;
        }

        const shop = await prisma.shop.create({
            data: shopData
        });

        res.status(201).json({
            success: true,
            shop
        });
    } catch (error) {
        return next(error);
    }
}

// Create stripe connect account link
export const createStripeConnectLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { sellerId } = req.body;

        if (!sellerId) return next(new ValidationError("Seller ID is required!"));

        const seller = await prisma.seller.findUnique({
            where: {
                id: sellerId
            }
        });

        if (!seller) {
            return next(new ValidationError("Seller is not available with this id!"));
        }

        const account = await stripe.accounts.create({
            type: "express",
            email: seller?.email,
            country: "DE",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true }
            }
        });

        await prisma.seller.update({
            where: {
                id: sellerId
            },
            data: {
                stripeId: account.id
            }
        });

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `http://localhost:3000/success`,
            return_url: `http://localhost:3000/success`,
            type: "account_onboarding"
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        return next(error);
    }
}

// Login seller
export const loginSeller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ValidationError("Email and password are required!"));
        }

        const seller = await prisma.seller.findUnique({ where: { email } });

        if (!seller) return next(new AuthError("Seller doesn't exists!"));

        // Verify password
        const isMatch = await bcrypt.compare(password, seller.password!)
        if (!isMatch) {
            return next(new AuthError("Invalid email or password!"));
        }

        // Generate access and refresh token
        const accessToken = jwt.sign({ id: seller.id, role: "seller" }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: seller.id, role: "seller" }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });

        // Store the refresh and access token in an httpOnly secure cookie
        setCookie(res, "seller_access_token", accessToken);
        setCookie(res, "seller_refresh_token", refreshToken);

        res.status(200).json({
            message: "Login successful!",
            user: { id: seller.id, email: seller.email, name: seller.name },
        })
    } catch (error) {
        return next(error);
    }
}

// Get logged in seller
export const getSeller = async (req: any, res: Response, next: NextFunction) => {
    try {
        const seller = req.seller;
        res.status(201).json({
            success: true,
            seller
        });
    } catch (error) {
        return next(error);
    }
};