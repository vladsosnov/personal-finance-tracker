/**
 * Lightweight confetti burst using DOM elements.
 * No dependencies - just CSS animations + cleanup.
 */
export const fireConfetti = () => {
  const PARTICLE_COUNT = 60;
  const COLORS = ["#316263", "#C36A4A", "#3E5C47", "#22C55E", "#F59E0B", "#3B82F6", "#EC4899"];

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement("div");
    const size = Math.random() * 8 + 4;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const startX = 50 + (Math.random() - 0.5) * 30;
    const endX = startX + (Math.random() - 0.5) * 80;
    const rotation = Math.random() * 720 - 360;
    const duration = Math.random() * 1000 + 1500;
    const delay = Math.random() * 300;

    particle.style.cssText = `
      position:absolute;
      left:${startX}%;
      top:40%;
      width:${size}px;
      height:${size * (Math.random() > 0.5 ? 1 : 0.6)}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      opacity:1;
      animation:confetti-fall ${duration}ms cubic-bezier(.25,.46,.45,.94) ${delay}ms forwards;
      --end-x:${endX - startX}vw;
      --rotation:${rotation}deg;
    `;
    container.appendChild(particle);
  }

  // Inject keyframes if not already present
  if (!document.getElementById("confetti-keyframes")) {
    const style = document.createElement("style");
    style.id = "confetti-keyframes";
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) translateX(var(--end-x)) rotate(var(--rotation)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 3000);
};
