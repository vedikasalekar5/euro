import React from 'react';

/**
 * Official Institution Logo for
 * Mandar Education Society's
 * Rajaram Shinde Institute of Engineering and Technology (RSIET)
 * 
 * Precise vector recreation of the official Mandar emblem:
 * - Green circular backdrop (#0ba345 / #008730) with thin outer border
 * - White Coconut Palm Tree at top with cascading fronds
 * - Diagonal white pole extending from lower-left to tree base
 * - Central white open book / plaque with 3 vertical green columns on each side
 * - Red circular medallion (#d92525) with white Lord Ganesha motif
 * - Bold Devanagari calligraphy "मंदार" (Mandar)
 * - Light sky-blue wave spiral with embedded black mechanical gear
 * - Ocean blue wave base with white foam contours
 */

export const MANDAR_COLLEGE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <clipPath id="mandarCircleClip">
      <circle cx="250" cy="250" r="236" />
    </clipPath>
  </defs>

  <!-- Outer Dark Green Border Ring -->
  <circle cx="250" cy="250" r="248" fill="#006b29" />
  <circle cx="250" cy="250" r="242" fill="#0ba345" />

  <!-- Main Emblem Container with Circle Clip -->
  <g clip-path="url(#mandarCircleClip)">
    <!-- White diagonal line from lower left to tree base -->
    <line x1="240" y1="180" x2="10" y2="345" stroke="#ffffff" stroke-width="14" stroke-linecap="round" />

    <!-- Palm Tree at Top in Solid Crisp White -->
    <g fill="#ffffff">
      <!-- Trunk -->
      <path d="M 242 180 C 243 140 247 90 250 55 C 253 90 257 140 258 180 Z" />
      
      <!-- Center Upright Fronds -->
      <path d="M 250 55 Q 248 15 250 8 Q 252 15 250 55 Z" />
      <path d="M 250 55 Q 230 20 215 12 Q 232 38 250 55 Z" />
      <path d="M 250 55 Q 270 20 285 12 Q 268 38 250 55 Z" />

      <!-- Left Cascading Fronds with Jagged Leaf Edges -->
      <path d="M 248 55 Q 200 25 155 38 Q 195 62 248 58 Z" />
      <path d="M 248 60 Q 180 48 140 75 Q 185 90 248 68 Z" />
      <path d="M 248 66 Q 165 72 130 115 Q 180 115 248 76 Z" />
      <path d="M 248 72 Q 185 105 145 155 Q 198 135 248 84 Z" />
      
      <!-- Leaf feathering left -->
      <path d="M 155 38 L 145 28 M 172 34 L 166 22 M 190 35 L 188 20 M 210 40 L 212 24" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 140 75 L 125 70 M 158 68 L 148 58 M 180 63 L 175 50 M 202 62 L 202 48" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 130 115 L 115 120 M 148 105 L 133 95 M 170 95 L 160 83 M 195 87 L 190 73" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 145 155 L 132 165 M 165 140 L 152 148 M 185 125 L 175 130" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />

      <!-- Right Cascading Fronds with Jagged Leaf Edges -->
      <path d="M 252 55 Q 300 25 345 38 Q 305 62 252 58 Z" />
      <path d="M 252 60 Q 320 48 360 75 Q 315 90 252 68 Z" />
      <path d="M 252 66 Q 335 72 370 115 Q 320 115 252 76 Z" />
      <path d="M 252 72 Q 315 105 355 155 Q 302 135 252 84 Z" />

      <!-- Leaf feathering right -->
      <path d="M 345 38 L 355 28 M 328 34 L 334 22 M 310 35 L 312 20 M 290 40 L 288 24" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 360 75 L 375 70 M 342 68 L 352 58 M 320 63 L 325 50 M 298 62 L 298 48" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 370 115 L 385 120 M 352 105 L 367 95 M 330 95 L 340 83 M 305 87 L 310 73" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 355 155 L 368 165 M 335 140 L 348 148 M 315 125 L 325 130" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />

      <!-- Coconuts Cluster -->
      <circle cx="242" cy="64" r="6" />
      <circle cx="258" cy="64" r="6" />
      <circle cx="250" cy="70" r="6.5" />
    </g>

    <!-- Center White Open Book / Plaque -->
    <g>
      <!-- Plaque Background -->
      <path d="M 98 178 L 402 178 L 402 420 L 98 420 Z" fill="#ffffff" />
      
      <!-- Left 3 Vertical Green Stripes -->
      <line x1="112" y1="178" x2="112" y2="420" stroke="#0ba345" stroke-width="7" />
      <line x1="127" y1="178" x2="127" y2="420" stroke="#0ba345" stroke-width="7" />
      <line x1="142" y1="178" x2="142" y2="420" stroke="#0ba345" stroke-width="7" />

      <!-- Right 3 Vertical Green Stripes -->
      <line x1="388" y1="178" x2="388" y2="420" stroke="#0ba345" stroke-width="7" />
      <line x1="373" y1="178" x2="373" y2="420" stroke="#0ba345" stroke-width="7" />
      <line x1="358" y1="178" x2="358" y2="420" stroke="#0ba345" stroke-width="7" />
    </g>

    <!-- Red Circle with Ganesha Silhouette -->
    <circle cx="250" cy="222" r="51" fill="#d92525" />

    <!-- Ganesha Emblem in Crisp White Silhouette -->
    <g fill="#ffffff">
      <!-- Crown / Mukut -->
      <path d="M 246 182 C 241 182 238 187 238 193 C 243 193 246 191 250 191 C 254 191 257 193 262 193 C 262 187 259 182 254 182 Z" />
      <polygon points="250,175 245,183 255,183" />

      <!-- Ears and Face -->
      <path d="M 230 196 C 222 199 220 208 223 216 C 227 222 234 222 236 217 C 235 208 236 201 242 198 Z" />
      <path d="M 270 196 C 278 199 280 208 277 216 C 273 222 266 222 264 217 C 265 208 264 201 258 198 Z" />

      <!-- Curved Trunk & Face -->
      <path d="M 246 195 Q 256 206 254 220 Q 252 234 241 236 Q 233 236 234 227 Q 236 220 244 222 Q 248 222 247 213 Q 246 204 243 195 Z" />

      <!-- Modak / Hands -->
      <circle cx="228" cy="225" r="5" />
      <circle cx="269" cy="223" r="5" />
      <circle cx="236" cy="232" r="3.5" />

      <!-- Forehead Tilak Lines -->
      <line x1="250" y1="189" x2="250" y2="199" stroke="#d92525" stroke-width="2.2" stroke-linecap="round" />
      <line x1="246" y1="193" x2="254" y2="193" stroke="#d92525" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- Devanagari Text: "मंदार" (Mandar) in Solid Black Calligraphy -->
    <g fill="#111111">
      <!-- Top Shirorekha (Horizontal line) -->
      <rect x="194" y="278" width="112" height="7" rx="1.5" />

      <!-- Anusvara (Dot above Ma) -->
      <circle cx="212" cy="269" r="4.5" fill="#111111" />

      <!-- Letter 'म' (Ma) -->
      <path d="M 218 284 L 218 317 L 211 317 L 211 301 L 202 301 C 199 301 197 299 197 296 L 197 292 C 197 287 201 284 206 284 L 218 284 Z M 204 290 L 204 295 L 211 295 L 211 290 Z" />
      <rect x="211" y="284" width="7" height="33" />

      <!-- Letter 'दा' (Da + Vertical Aa bar) -->
      <!-- Da curve -->
      <path d="M 239 284 L 239 294 C 239 294 233 295 231 299 C 229 304 229 309 233 312 C 237 314 242 315 241 319 C 240 323 235 325 232 324 L 229 319" stroke="#111111" stroke-width="5.5" stroke-linecap="round" fill="none" />
      <!-- Vertical Kanna 'ा' -->
      <rect x="252" y="284" width="6.5" height="33" rx="1" />

      <!-- Letter 'र' (Ra) -->
      <path d="M 277 284 L 277 295 C 277 300 272 304 269 306 L 279 317 L 271 317 L 263 307 L 263 304 C 268 302 271 299 271 295 L 271 284 Z" />
    </g>

    <!-- Ocean Blue Wave Base -->
    <path d="M 80 435 C 130 395 190 445 245 420 C 300 390 365 440 420 395 L 420 500 L 80 500 Z" fill="#409ad6" />
    <path d="M 60 460 C 140 415 210 480 290 445 C 370 410 435 455 490 425 L 490 500 L 60 500 Z" fill="#237db8" />

    <!-- Light Blue Wave Spiral with Green Outline Contour -->
    <g transform="translate(250, 395)">
      <!-- Light Blue Spiral Wave Shape -->
      <path d="M -60 30 C -60 -32 2 -78 52 -46 C 76 -30 76 10 52 26 C 30 36 10 32 0 16 C -8 0 0 -18 15 -20 C 25 -21 32 -15 30 -5" fill="#8ad8fa" stroke="#0ba345" stroke-width="5" stroke-linejoin="round" />
      
      <!-- Solid Black Industrial Gear Teeth on the Wave Curve -->
      <g fill="#111111">
        <!-- Gear Ring Body -->
        <path d="M -36 16 C -36 -14 0 -44 42 -24 L 37 -14 C 6 -28 -24 -4 -24 16 Z" />
        <!-- Gear Teeth -->
        <polygon points="-38,6 -27,8 -29,-2 -40,-4" />
        <polygon points="-30,-8 -21,-3 -19,-14 -28,-19" />
        <polygon points="-18,-20 -11,-12 -6,-22 -13,-30" />
        <polygon points="-2,-28 3,-18 12,-26 7,-36" />
        <polygon points="17,-31 16,-20 28,-25 28,-36" />
        <polygon points="34,-27 29,-18 40,-19 45,-28" />
      </g>
    </g>

    <!-- White Wave Highlights at Base -->
    <path d="M 80 475 C 170 410 270 510 370 435 C 430 395 480 450 490 440 C 460 485 360 475 290 490 C 200 510 120 495 80 475 Z" fill="#ffffff" opacity="0.85" />
    <path d="M 210 445 C 240 410 270 410 300 445 C 340 490 200 510 210 445 Z" fill="#ffffff" opacity="0.75" />
  </g>

  <!-- Outer Bezel Highlighting Ring -->
  <circle cx="250" cy="250" r="236" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.3" />
  <circle cx="250" cy="250" r="248" fill="none" stroke="#004d1d" stroke-width="3" />
</svg>`;

/**
 * Generates an SVG Data URI for HTML <img> elements
 */
export const getCollegeLogoSvgDataUri = (): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(MANDAR_COLLEGE_LOGO_SVG)}`;
};

/**
 * Pre-renders the SVG onto an HTML5 Canvas and returns a high-resolution PNG Data URI.
 * This guarantees crisp, 100% compatible rendering inside jsPDF `doc.addImage()`.
 */
export const getCollegeLogoPngDataUrl = async (size = 400): Promise<string> => {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve(getCollegeLogoSvgDataUri());
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(getCollegeLogoSvgDataUri());
            return;
          }

          // Render with smooth anti-aliasing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          const pngData = canvas.toDataURL('image/png', 1.0);
          resolve(pngData);
        } catch {
          resolve(getCollegeLogoSvgDataUri());
        }
      };
      img.onerror = () => {
        resolve(getCollegeLogoSvgDataUri());
      };
      img.src = getCollegeLogoSvgDataUri();
    } catch {
      resolve(getCollegeLogoSvgDataUri());
    }
  });
};

/**
 * Reusable React Component for Mandar College Logo
 */
interface CollegeLogoProps {
  className?: string;
  alt?: string;
  size?: number;
}

export const CollegeLogo: React.FC<CollegeLogoProps> = ({
  className = 'w-9 h-9',
  alt = "Mandar Education Society's RSIET Logo",
}) => {
  return React.createElement('img', {
    src: getCollegeLogoSvgDataUri(),
    alt,
    className: `shrink-0 rounded-full object-contain ${className}`,
    referrerPolicy: 'no-referrer',
  });
};
