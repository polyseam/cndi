# installing cndi

Installing CNDI is all about getting the binaries from our latest release from
[GitHub Releases](https://github.com/polyseam/cndi/releases), and putting them
in the right spot.

We provide scripts below which automate the process of downloading the latest
"tarball" and adding the contained binaries to your `PATH`.

## macos and linux

Installing for macOS and Linux is the way to go if you have that option. Simply
run the following:

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

## windows

Installing for Windows should be just as easy. Here is the command to install
CNDI on Windows:

```powershell
irm https://raw.githubusercontent.com/polyseam/cndi/main/install.ps1 | iex
```

## stuck?

If you are having issues installing CNDI, you can try downloading the tarball
from [GitHub Releases](https://github.com/polyseam/cndi/releases) and extracting
the binaries to a directory in your `PATH`.

If you are still having issues, please add to the following
[Discussion Post](https://github.com/orgs/polyseam/discussions/871)!
