import type {} from "@girs/gnome-shell/ui/messageTray";

declare module "@girs/gnome-shell/ui/messageTray" {
	/** Present on {@link NotificationApplicationPolicy} / {@link NotificationGenericPolicy}; merged for tray sources. */
	interface NotificationPolicy {
		readonly id: string;
	}
}
