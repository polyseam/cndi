#!/bin/sh

set -e

main() {
	cndi_install="${CNDI_INSTALL:-$HOME/bin}"

	if [ "$OS" = "Windows_NT" ]; then
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

	cndi_uri="https://cndi-binaries.s3.amazonaws.com/cndi/main/cndi-${target}"

	exe="$cndi_install/cndi"

	if [ ! -d "$cndi_install" ]; then
		mkdir -p "$cndi_install"
	fi

	echo "$cndi_uri"
	curl --fail --location --progress-bar --output "$exe" "$cndi_uri"
	chmod +x "$exe"

	echo "cndi was downloaded successfully to $exe"

	if command -v cndi >/dev/null; then
        cndi install
		echo "Run 'cndi --help' to get started"
	else
    
		case "$SHELL" in
		/bin/zsh) shell_profile=".zshrc" ;;
		*) shell_profile=".bashrc" ;;
		esac

        source $HOME/$shell_profile
        
		echo "Run '$exe --help' to get started"
	fi

}

main "$@"