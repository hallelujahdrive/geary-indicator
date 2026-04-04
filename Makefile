NAME=geary-indicator
DOMAIN=52hertz-reunion.site

.PHONY: all pack install clean

all: dist/extension.js dist/stylesheet.css

node_modules: package.json
	bun install

dist/extension.js: node_modules
	bun run build

dist/stylesheet.css: src/stylesheet.css
	cp src/stylesheet.css dist/stylesheet.css

$(NAME)@$(DOMAIN).shell-extension.zip: dist/extension.js dist/stylesheet.css
	@gnome-extensions pack --force --podir=../po --extra-source=../metadata.json ./dist

pack: $(NAME)@$(DOMAIN).shell-extension.zip

install: $(NAME)@$(DOMAIN).shell-extension.zip
	@gnome-extensions install --force $(NAME)@$(DOMAIN).shell-extension.zip

clean:
	@rm -rf dist node_modules $(NAME)@$(DOMAIN).shell-extension.zip