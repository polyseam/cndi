# building cndi (contributor guide) 🛠️

If you are hoping to contribute to this project and want to learn the ropes, you
are in the right place. Let's start with setting up your environment:

## setup 🦕

The first step as you might expect is to clone this repo. Take note of where you
clone to, it will matter later when we setup some convenience aliases.

**1. Clone Repo:**

```bash
gh repo clone polyseam/cndi
```

**2. Install Deno:**

Next let's [install deno](https://deno.land/#installation), though it can be
installed with a package manager, I would recommend that you install it without
one. Once Deno is installed, make sure you add it to your PATH.

**3. Setup cndi Alias:** Let's setup an alias that allows us to use the deno
source code as if it were the regular CLI, without colliding with the released
`cndi` binary

```bash
# make sure the path below is correct, pointing to the main.ts file in the repo
alias cndi-next="deno run -A ~/dev/polyseam/cndi/main.ts"
```

Now that we've done that setup we can run commands using the current checked out
branch of the repo with `cndi-next` and we can leave the `cndi` command for the
released binary.

## selecting an issue 🎯

If you are looking for ways to contribute we would be excited to help onboard
you and point you in the right direction. Please shoot us a message on
[discord.gg/ygt2rpegJ5](https://discord.gg/ygt2rpegJ5) and we'll point you in
the right direction.
