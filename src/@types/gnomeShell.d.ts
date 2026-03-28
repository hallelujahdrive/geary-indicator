declare module "resource:///org/gnome/shell/ui/panelMenu.js" {
	import type { Button as PanelMenuButton } from "@girs/gnome-shell/ui/panelMenu";

	export class Button extends PanelMenuButton {
		menu: PopupMenu.PopupMenu;
	}
}
