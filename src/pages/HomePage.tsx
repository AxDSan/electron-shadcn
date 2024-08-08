import React from "react";
import ToggleTheme from "@/components/ToggleTheme";
import { useTranslation } from "react-i18next";
import LangToggle from "@/components/LangToggle";
import ChatUI from "@/components/ChatUI";

export default function HomePage() {
    const { t } = useTranslation();

    return (
        <>
            <div className="flex h-screen flex-col items-center justify-center gap-2 bg-gray-100">
                <h1 className="text-4xl font-bold mb-4">FLUX CHAT</h1>
                <ChatUI />
            </div>
        </>
    );
}