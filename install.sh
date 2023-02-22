#!/bin/sh

set -e

main() {
	cndi_install="${CNDI_INSTALL:-$HOME/bin}"
	bin_suffix=""
	if [ "$OS" = "Windows_NT" ]; then
		bin_suffix=".exe"
		target="win.exe"
	else
		case $(uname -sm) in
		"Darwin x86_64") target="mac" ;;
		"Darwin arm64") target="mac" ;;
		"Linux aarch64")
			echo "Error: Official CNDI builds for Linux aarch64 are not available" 1>&2
			exit 1
			;;
		"Linux x86_64")
			target="linux"
			;;
		*)
			target="linux"
		esac
	fi

	cndi_uri="https://github.com/polyseam/cndi/releases/latest/download/cndi-${target}"

	exe="$cndi_install/cndi$bin_suffix"

	if [ ! -d "$cndi_install" ]; then
		mkdir -p "$cndi_install"
	fi

	echo "$cndi_uri"
	curl --fail --location --progress-bar --output "$exe" "$cndi_uri"
	chmod +x "$exe"

	echo "cndi was downloaded successfully to $exe"

	if ! command -v cndi >/dev/null; then
		case "$SHELL" in
		/bin/zsh) shell_profile=".zshrc" ;;
		*) shell_profile=".bash_profile" ;;
		esac

		# append or create alias in $shell_profile
		if [ "$OS" = "Windows_NT" ]; then
			windows_alias = "alias cndi='winpty $exe'"
			# if $windows_alias is not in $shell_profile then append it
			if ! grep -q "$windows_alias" "$HOME/$shell_profile"; then
				echo "creating alias for Windows..."
				echo "$windows_alias" | tee -a "$HOME/$shell_profile"
			fi
		fi

		# if ~/bin is not in $PATH then append it
		if ! grep -q "$cndi_install" "$HOME/$shell_profile"; then
			echo "adding $cndi_install to \$PATH"
			command printf '\nexport PATH="%s:$PATH"' "$cndi_install" >>"$HOME/$shell_profile"
			echo "Please restart your terminal then run 'cndi --help' to get started!"
			exit 0 # exit early because sourcing $shell_profile will not work in this shell (probably macOS)
		fi

		# source $shell_profile
		if [ -f "$HOME/$shell_profile" ]; then
			echo "sourcing $HOME/$shell_profile"
			. "$HOME/$shell_profile"
		fi
	fi
	echo "Run 'cndi --help' to get started!"
}

main "$@"