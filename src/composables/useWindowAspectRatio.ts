import { onMounted, onUnmounted } from "vue";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).__TAURI__;
}

export function useWindowAspectRatio(aspectRatio: number) {
  onMounted(async () => {
    if (!isTauri()) return;

    const appWindow = getCurrentWindow();
    let lastSet: { width: number; height: number } | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function enforce(size: { width: number; height: number }) {
      if (!size.width || !size.height) return;

      if (
        lastSet &&
        Math.abs(size.width - lastSet.width) <= 2 &&
        Math.abs(size.height - lastSet.height) <= 2
      ) {
        lastSet = null;
        return;
      }

      const currentRatio = size.width / size.height;
      if (Math.abs(currentRatio - aspectRatio) < 0.005) return;

      let newWidth = size.width;
      let newHeight = size.height;

      if (currentRatio > aspectRatio) {
        newWidth = Math.round(size.height * aspectRatio);
      } else {
        newHeight = Math.round(size.width / aspectRatio);
      }

      lastSet = { width: newWidth, height: newHeight };
      appWindow.setSize(new PhysicalSize(newWidth, newHeight)).catch(() => {
        lastSet = null;
      });
    }

    const unlisten = await appWindow.onResized(({ payload: size }) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => enforce(size), 120);
    });

    onUnmounted(() => {
      unlisten();
      if (debounceTimer) clearTimeout(debounceTimer);
    });
  });
}
