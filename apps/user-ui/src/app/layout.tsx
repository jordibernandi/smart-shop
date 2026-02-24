import Header from "../shared/widgets/header";
import "./global.css";
import Providers from "./providers";

export const metadata = {
  title: "Smart Shop",
  description: "Smart Commerce Shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
