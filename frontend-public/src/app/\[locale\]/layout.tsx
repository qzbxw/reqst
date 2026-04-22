import { Inter } from "next/font/google";
import { UIProvider } from "@/components/UIProvider";

const inter = Inter({ subsets: ["latin"] });

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  
  return (
    <div lang={locale} className={inter.className}>
      <UIProvider initialLanguage={locale as "ru" | "en"}>
        {props.children}
      </UIProvider>
    </div>
  );
}
