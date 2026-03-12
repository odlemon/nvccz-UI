"use client";

import { motion } from "framer-motion";
import { CiLocationOn, CiSun, CiCloud, CiCloudDrizzle } from "react-icons/ci";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/lib/store";

export function GreetWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState("Harare, Zimbabwe");
  const [weather, setWeather] = useState({
    condition: "Partly Cloudy",
    temperature: "24°C",
    humidity: "65%",
    wind: "12 km/h",
  });

  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse geocoding to get city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();

            if (data.city && data.countryName) {
              setUserLocation(`${data.city}, ${data.countryName}`);
            }
          } catch (error) {
            console.log("Could not get location:", error);
            // Keep default location
          }
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Keep default location
        }
      );
    }
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl border border-white/10">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/cloud-blue-sky.jpg')",
        }}
      />

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>

      {/* Animated Background Clouds - Subtle overlay on real sky */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-4 left-8 opacity-15"
          animate={{
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <CiCloud className="w-16 h-16 text-white/80 drop-shadow-lg" />
        </motion.div>

        <motion.div
          className="absolute top-8 right-12 opacity-10"
          animate={{
            x: [0, -15, 0],
            y: [0, 5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <CiCloud className="w-12 h-12 text-white/80 drop-shadow-lg" />
        </motion.div>

        <motion.div
          className="absolute bottom-6 left-16 opacity-20"
          animate={{
            x: [0, 25, 0],
            y: [0, -8, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        >
          <CiCloudDrizzle className="w-14 h-14 text-white/80 drop-shadow-lg" />
        </motion.div>

        <motion.div
          className="absolute top-12 right-20 opacity-12"
          animate={{
            x: [0, -20, 0],
            y: [0, 12, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <CiSun className="w-10 h-10 text-yellow-300/90 drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
          <div className="flex justify-between items-start">
            {/* Left: Greeting, Location & Time/Date */}
            <div className="flex-1">
              <h1 className="text-4xl drop-shadow-lg">{getGreeting()}, {user?.firstName || 'User'}</h1>
              <div className="flex items-center gap-2 mt-1 mb-8">
                <CiLocationOn className="w-4 h-4 text-white/80 drop-shadow-md" />
                <span className="text-sm text-white/80 drop-shadow-md">
                  {userLocation}
                </span>
              </div>

              {/* Time and Date below greeting and location */}
            </div>

            {/* Right: Weather Forecast (top right) */}
            <div className="text-right">
              <h3 className="text-sm font-semibold mb-2 drop-shadow-md">
                Weather Forecast
              </h3>
              <div className="text-lg font-medium mb-1 drop-shadow-md">
                {weather.condition}
              </div>
              <div className="text-xs text-white/80 drop-shadow-sm">
                Isolated thunderstorms, Precipitation: 30%
              </div>
            </div>
          </div>

          {/* Bottom Right: Weather Details */}
          <div className="flex justify-end mt-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-xs text-white/80 drop-shadow-sm">Temp</div>
                <div className="font-semibold drop-shadow-md">
                  {weather.temperature}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/80 drop-shadow-sm">
                  Humidity
                </div>
                <div className="font-semibold drop-shadow-md">
                  {weather.humidity}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/80 drop-shadow-sm">Wind</div>
                <div className="font-semibold drop-shadow-md">
                  {weather.wind}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-start ">
            <div className="flex-col items-center gap-6 text-sm">
              <div className="text-4xl drop-shadow-lg p">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-white/80 drop-shadow-md">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
