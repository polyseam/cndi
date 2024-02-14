#!/bin/sh

set -e

main() {
    cndi_install="${CNDI_INSTALL:-$HOME/.cndi}"
    bin_dir="$cndi_install/bin"
    bin_suffix=""

    if [ "$OS" = "Windows_NT" ]; then # WSL or Git Bash or Cygwin
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

    if ! command -v unzip >/dev/null; then
        echo "Error: unzip is required to install and upgrade CNDI!" 1>&2
        exit 1
    fi
        
    cndi_uri="https://github.com/polyseam/cndi/releases/latest/download/cndi-${target}.tar.gz"
    
    exe="$bin_dir/cndi"
    
    if [ ! -d "$bin_dir" ]; then
        mkdir -p "$bin_dir"
    fi
    
    curl --fail --location --progress-bar --output "$exe.tar.gz" "$cndi_uri"
    tar -xzf "$exe.tar.gz" -C "$bin_dir"
    
    chmod +x "$exe"
    chmod +x "$bin_dir/kubeseal"
    chmod +x "$bin_dir/terraform"
    
    rm "$exe.tar.gz"
    
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
    
    echo "Please restart your terminal then run 'cndi --help' to get started!"
    echo
    echo "Stuck? Join our Discord https://cndi.run/di?utm_id=5096"
}

main "$@"
