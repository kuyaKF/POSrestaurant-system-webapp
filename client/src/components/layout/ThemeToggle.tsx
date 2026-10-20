import { useTheme } from "../../context/ThemeContext";
import { IconMoon, IconSun } from "./icons";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="icon-btn theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <IconSun className="icon-btn-svg" /> : <IconMoon className="icon-btn-svg" />}
    </button>
  );
}
