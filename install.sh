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
    
    # set shell profile for user shell
    case "$SHELL" in
        /bin/zsh) shell_profile=".zshrc" ;;
        *) shell_profile=".profile" ;;
    esac
    
    # if $cndi_install is not in $PATH
    if ! command -v cndi >/dev/null; then
        # if $cndi_install is not in $shell_profile
        if ! grep -q "$cndi_install" "$HOME/$shell_profile"; then
            echo "adding $cndi_install to \$PATH"
            command printf '\nexport PATH="%s:$PATH"' "$cndi_install" >>"$HOME/$shell_profile"
            echo "Please restart your terminal then run 'cndi --help' to get started!"
            exit 0 # exit early because sourcing $shell_profile will cause an error
        fi
    fi
    
    # if $shell_profile is .zshrc exit because sourcing it will cause an error
    if [ "$shell_profile" = ".zshrc" ]; then
        echo "Run 'cndi --help' to get started!"
        exit 0
    fi
    
    # source $shell_profile
    if [ -f "$HOME/$shell_profile" ]; then
        echo "sourcing $HOME/$shell_profile"
        . "$HOME/$shell_profile"
    fi
    
    echo "Run 'cndi --help' to get started!"
}

main "$@"
