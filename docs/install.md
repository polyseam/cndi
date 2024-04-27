# installing cndi

Installing CNDI is all about getting the binaries from our latest release, and
putting them in the right spot.

## macos and linux

Installing for macOS and Linux is the way to go if you have that option. This is
how it's done, the same line from the top of our [README](/README.md):

```bash
curl -fsSL https://raw.githubusercontent.com/polyseam/cndi/main/install.sh | sh
```

If you open a fresh terminal window and `cndi --help` is not working, the path
to the `cndi` binary by default is `~/.cndi/bin`. Adding this directory to your
`PATH` environment variable should allow the CLI to be called from any
directory.

## windows

Installing for Windows should be just as easy. Here is the command to install
CNDI on Windows:

```powershell
irm https://raw.githubusercontent.com/polyseam/cndi/main/install.ps1 | iex
```
