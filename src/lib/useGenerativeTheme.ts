"use client"; // Wichtig, da dieser Hook document/canvas (Client-APIs) nutzt

import { useState, useEffect } from 'react';

/**
 * Ein Hook, der bei jedem Seitenaufruf ein dynamisches Favicon
 * und einen passenden CSS-Hintergrundverlauf generiert.
 * * JETZT MIT:
 * 1. Einem einfachen linearen Verlauf, der nur harmonische (analoge) Farben nutzt.
 * 2. Einem .ico, das den Verlauf als ".ff" Text-Maske nutzt.
 */
export function useGenerativeTheme() {
  const [backgroundGradient, setBackgroundGradient] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // === 1. Farben generieren (MODIFIZIERT) ===
    const baseHue = Math.floor(Math.random() * 360);
    // const complementHue = (baseHue + 180) % 360; // Komplementärfarbe entfernt
    const saturation = 90;
    const lightness = 50; 

    // Nur noch 3 harmonische/analoge Farben
    const color1 = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`; // L: 50
    const color2 = `hsl(${(baseHue + 20) % 360}, ${saturation - 10}%, ${lightness + 5}%)`; // L: 55
    const color3 = `hsl(${(baseHue + 40) % 360}, ${saturation - 20}%, ${lightness + 10}%)`; // L: 60
    // const colorComplement = ... // Entfernt


    // === 2. Hintergrund-CSS (KORRIGIERT) ===
    
    const randomAngle = Math.floor(Math.random() * 360);

    // KORREKTUR: Wir verwenden nur noch die 3 analogen Farben.
    const gradientString = `linear-gradient(${randomAngle}deg, ${color1}, ${color2}, ${color3})`;
    
    setBackgroundGradient(gradientString); 

    // === 3. Dynamisches Favicon (MODIFIZIERT) ===
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Schritt A: Zeichne den Verlauf (nutzt jetzt color1, color2, color3)
      const iconGradient = ctx.createLinearGradient(0, 0, 32, 32);
      iconGradient.addColorStop(0, color1);
      iconGradient.addColorStop(0.5, color2); // Mitte ist jetzt color2
      iconGradient.addColorStop(1, color3);
      
      ctx.fillStyle = iconGradient;
      ctx.fillRect(0, 0, 32, 32); 

      // Schritt B: Wende die Text-Maske an
      ctx.globalCompositeOperation = 'destination-in';
      
      ctx.fillStyle = 'black'; 
      ctx.font = 'bold 28px Inter, sans-serif'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('.ff', 16, 17); 
      
      ctx.globalCompositeOperation = 'source-over';

      // Schritt C: Canvas in URL umwandeln und zuweisen
      const faviconUrl = canvas.toDataURL('image/png');

      const faviconLink = document.querySelector("link[rel='icon'][href='/favicon.ico']");
      if (faviconLink) {
        faviconLink.setAttribute('href', faviconUrl);
      }
      const favicon32Link = document.querySelector("link[href='/favicon-32x32.png']");
      if (favicon32Link) {
        favicon32Link.setAttribute('href', faviconUrl);
      }
    }

  }, []); // Leeres Array = wird nur 1x beim Laden der Seite ausgeführt

  return { backgroundGradient, isClient };
}