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
            "Darwin x86_64") target="mac-amd64" ;;
            "Darwin arm64") target="mac-arm64" ;;
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
    chmod +x "$bin_dir/kubeseal-cndi"
    chmod +x "$bin_dir/terraform-cndi"
    
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

        if ! grep -q "$bin_dir" "$HOME/$shell_profile"; then
            echo "adding $bin_dir to \$PATH"
            command printf '\nexport PATH="%s:$PATH"' "$bin_dir" >>"$HOME/$shell_profile"
        fi
    fi
    
    # if $shell_profile is .zshrc exit because sourcing it will cause an error
    if [ "$shell_profile" = ".zshrc" ]; then
        echo "finalizing installation..."
        # running 'cndi --help' will save the user wait time on first run
        $exe --help --welcome
        echo
        echo "cndi was installed successfully! Please restart your terminal."
        echo "Need some help? Join our Discord https://cndi.run/di?utm_id=5096"
        echo
        exit 0
    fi
    
    # source $shell_profile
    if [ -f "$HOME/$shell_profile" ]; then
        echo "sourcing $HOME/$shell_profile"
        . "$HOME/$shell_profile"
        echo "finalizing installation..."
        # running 'cndi --help' will save the user wait time on first run
        $exe --help --welcome
        echo
        echo "cndi was installed successfully! Please restart your terminal."
        echo "Need some help? Join our Discord https://cndi.run/di?utm_id=5096"
        echo
        exit 0
    fi
}

main "$@"
