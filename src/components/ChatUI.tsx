import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as fal from "@fal-ai/serverless-client";
import ToggleTheme from "./ToggleTheme";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Message {
    text: string;
    sender: "user" | "ai";
    imageUrls?: string[];
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

    const handleSettingChange = (key: keyof ImageGenerationSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSend = async () => {
        if (settings.prompt.trim()) {
            const userMessage: Message = { text: settings.prompt, sender: "user" };
            setMessages([...messages, userMessage]);
            setIsGenerating(true);

            try {
                const result = await fal.subscribe("fal-ai/flux/schnell", {
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
                    text: "Here are the images I generated based on your prompt:",
                    sender: "ai",
                    imageUrls: result.images.map(img => img.url)
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

    const handleImageAction = (action: string, imageUrl: string) => {
        switch (action) {
            case "view":
                window.open(imageUrl, "_blank");
                break;
            case "copy":
                navigator.clipboard.writeText(imageUrl);
                break;
            case "download":
                const link = document.createElement("a");
                link.href = imageUrl;
                link.download = "generated-image.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                break;
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
                        className={`mb-4 p-2 rounded ${
                            msg.sender === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-black self-start"
                        }`}
                        style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start" }}
                    >
                        <p>{msg.text}</p>
                        {msg.imageUrls && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {msg.imageUrls.map((url, imgIndex) => (
                                    <div key={imgIndex} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Generated ${imgIndex + 1}`}
                                            className="h-auto w-full max-w-256 rounded"
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                handleImageAction("view", url);
                                            }}
                                        />
                                        <DropdownMenu
                                            trigger={
                                                <button className="absolute top-1 right-1 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            }
                                        >
                                            <DropdownMenuItem onClick={() => handleImageAction("view", url)}>
                                                View Image
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleImageAction("copy", url)}>
                                                Copy Image URL
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleImageAction("download", url)}>
                                                Download Image
                                            </DropdownMenuItem>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
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