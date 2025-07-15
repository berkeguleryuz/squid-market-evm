"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";

interface WaitlistFormData {
  email: string;
  wallet: string;
}

export default function Home() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<WaitlistFormData>({
    email: "",
    wallet: "",
  });

  const headerImageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    gsap.set([logoRef.current, titleRef.current, buttonRef.current], {
      opacity: 0,
      y: 30,
    });

    gsap.set(headerImageRef.current, {
      opacity: 0,
    });

    const tl = gsap.timeline();
    tl.to(headerImageRef.current, {
      duration: 1.2,
      opacity: 1,
      ease: "power2.out",
    })
      .to(
        logoRef.current,
        { duration: 0.8, opacity: 1, y: 0, ease: "power2.out" },
        "-=0.6",
      )
      .to(
        titleRef.current,
        { duration: 0.6, opacity: 1, y: 0, ease: "power2.out" },
        "-=0.4",
      )
      .to(
        buttonRef.current,
        { duration: 0.6, opacity: 1, y: 0, ease: "power2.out" },
        "-=0.3",
      );
  }, []);

  const openPopup = () => {
    setIsPopupOpen(true);
    setMessage("");
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (!formData.wallet.startsWith("0x")) {
      setMessage("Wallet address must start with 0x");
      setIsLoading(false);
      return;
    }

    if (formData.wallet.length !== 42) {
      setMessage("Wallet address must be 42 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Successfully added to waitlist!");
        setFormData({ email: "", wallet: "" });
        setTimeout(() => {
          closePopup();
        }, 6000);
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="max-w-2xl mx-auto px-6 text-center py-20 relative z-10">
        <div ref={logoRef} className="mb-8">
          <Image
            src="/squidlogo.jpg"
            alt="Squid Logo"
            width={120}
            height={120}
            className="mx-auto"
          />
        </div>

        <h1
          ref={titleRef}
          className="text-5xl md:text-6xl font-light mb-6 tracking-tight font-exo2">
          Squid Market
        </h1>

        <button
          ref={buttonRef}
          onClick={openPopup}
          className="px-8 py-3 cursor-pointer bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-all duration-200 tracking-wide">
          Join Waitlist
        </button>
      </div>

      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogPortal>
          <DialogOverlay className="backdrop-blur-md bg-black/70" />
          <DialogContent
            className="bg-gradient-to-tl border-b-2 from-black to-gray-900 text-white max-w-md"
            showCloseButton={true}>
            <DialogHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src="/squidlogow.jpg"
                  alt="Squid Logo"
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-white shadow-lg"
                />
              </div>
              <DialogTitle className="text-2xl font-light text-white font-exo2">
                Join Squid Market Waitlist
              </DialogTitle>
              <p className="text-gray-300 text-sm font-rajdhani">
                Be the first to access of Squid Market.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white font-rajdhani">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 text-white border border-white/20 rounded-lg focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-500 font-rajdhani"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="wallet"
                  className="block text-sm font-medium text-white font-rajdhani">
                  Wallet Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="wallet"
                  name="wallet"
                  value={formData.wallet}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-black/60 text-white border border-white/20 rounded-lg focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-500 font-rajdhani"
                  placeholder="0x1234567890abcdef..."
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg text-sm border-2 font-rajdhani ${
                    message.includes("Successfully")
                      ? "bg-green-200 font-bold text-green-900 border-green-200"
                      : "bg-red-200 font-bold text-red-900 border-red-200"
                  }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black font-semibold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border-2 border-white cursor-pointer hover:bg-gray-300 transform font-exo2">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Adding to Waitlist...
                  </div>
                ) : (
                  <div className="flex items-center text-center justify-center gap-2">
                    <Image
                      src="/squidlogo.jpg"
                      alt="Squid Logo"
                      width={24}
                      height={24}
                      className="rounded-full mt-1"
                    />
                    Join the Squid Army
                  </div>
                )}
              </button>
            </form>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div
        ref={headerImageRef}
        className="absolute bottom-0 left-0 w-full h-120 2xl:h-160 rounded-tr-[200px] rounded-tl-[200px] border-t-2 border-white/50 shadow-[0_0_140px_rgba(255,255,255,0.5)] overflow-hidden">
        <Image
          src="/squidheader.jpg"
          alt="Squid Header"
          fill
          className="lg:object-fit lg:object-cover object-left object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black opacity-70" />
      </div>
    </div>
  );
}
