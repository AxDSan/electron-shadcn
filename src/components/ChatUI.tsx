import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as fal from "@fal-ai/serverless-client";
import ToggleTheme from "./ToggleTheme";

interface Message {
    text: string;
    sender: "user" | "ai";
    imageUrl?: string;
}

interface ImageGenerationSettings {
    prompt: string;
    image_size: string;
    num_inference_steps: number;
    seed: number | null;
    guidance_scale: number;
    sync_mode: boolean;
    num_images: number;
    enable_safety_checker: boolean;
}

const ChatUI = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [settings, setSettings] = useState<ImageGenerationSettings>({
        prompt: "",
        image_size: "landscape_4_3",
        num_inference_steps: 28,
        seed: null,
        guidance_scale: 3.5,
        sync_mode: false,
        num_images: 1,
        enable_safety_checker: true,
    });

    useEffect(() => {
        fal.config({
            credentials: "38d59b0d-fcb9-403a-9156-b702f110f833:17e983b2829c63d2c47d1b1f22050f08"
        });
    }, []);

    const handleSettingChange = (key: keyof ImageGenerationSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSend = async () => {
        if (settings.prompt.trim()) {
            const userMessage: Message = { text: settings.prompt, sender: "user" };
            setMessages([...messages, userMessage]);
            setIsGenerating(true);

            try {
                const result = await fal.subscribe("fal-ai/flux/dev", {
                    input: {
                        ...settings,
                        seed: settings.seed || undefined,
                    },
                    logs: true,
                    onQueueUpdate: (update) => {
                        if (update.status === "IN_PROGRESS" && update.logs) {
                            update.logs.forEach(log => {
                                if (log.message) {
                                    console.log(log.message);
                                }
                            });
                        }
                    },
                });

                const aiMessage: Message = {
                    text: "Here's the image I generated based on your prompt:",
                    sender: "ai",
                    imageUrl: result.images[0].url
                };
                setMessages((prevMessages) => [...prevMessages, aiMessage]);
            } catch (error) {
                console.error("Error generating image:", error);
                const errorMessage: Message = {
                    text: "Sorry, I couldn't generate an image. Please try again.",
                    sender: "ai"
                };
                setMessages((prevMessages) => [...prevMessages, errorMessage]);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    return (
        <div className="flex flex-col w-full h-full p-4 bg-white shadow-lg rounded-lg">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Image Generation Chat</h2>
                <Button variant="outline" size="sm">End Chat</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`mb-4 p-2 rounded max-w-xs ${
                            msg.sender === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-black self-start"
                        }`}
                        style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start" }}
                    >
                        <p>{msg.text}</p>
                        {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="Generated" className="mt-2 h-auto w-full max-w-256 rounded" />
                        )}
                    </div>
                ))}
            </div>
            <div className="p-4 border-t">
                <Input
                    value={settings.prompt}
                    onChange={(e) => handleSettingChange("prompt", e.target.value)}
                    placeholder="Describe an image to generate..."
                    className="mb-2"
                    disabled={isGenerating}
                />
                <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                        <Label>Image Size</Label>
                        <Select
                            value={settings.image_size}
                            onValueChange={(value) => handleSettingChange("image_size", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select image size" />
                            </SelectTrigger>
                            <SelectContent>
                                {["square_hd", "square", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"].map((size) => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Inference Steps: {settings.num_inference_steps}</Label>
                        <Slider
                            value={[settings.num_inference_steps]}
                            onValueChange={(value) => handleSettingChange("num_inference_steps", value[0])}
                            min={1}
                            max={50}
                            step={1}
                        />
                    </div>
                    <div>
                        <Label>Seed</Label>
                        <Input
                            type="number"
                            value={settings.seed || ""}
                            onChange={(e) => handleSettingChange("seed", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Random"
                        />
                    </div>
                    <div>
                        <Label>Guidance Scale: {settings.guidance_scale.toFixed(1)}</Label>
                        <Slider
                            value={[settings.guidance_scale]}
                            onValueChange={(value) => handleSettingChange("guidance_scale", value[0])}
                            min={1}
                            max={20}
                            step={0.1}
                        />
                    </div>
                    <div>
                        <Label>Number of Images: {settings.num_images}</Label>
                        <Slider
                            value={[settings.num_images]}
                            onValueChange={(value) => handleSettingChange("num_images", value[0])}
                            min={1}
                            max={4}
                            step={1}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={settings.sync_mode}
                            onCheckedChange={(checked) => handleSettingChange("sync_mode", checked)}
                        />
                        <Label>Sync Mode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={settings.enable_safety_checker}
                            onCheckedChange={(checked) => handleSettingChange("enable_safety_checker", checked)}
                        />
                        <Label>Enable Safety Checker</Label>
                    </div>
                </div>
                <Button onClick={handleSend} disabled={isGenerating} className="w-full">
                    {isGenerating ? "Generating..." : "Generate Image"}
                </Button>
                <ToggleTheme></ToggleTheme>
            </div>
        </div>
    );
};

export default ChatUI;