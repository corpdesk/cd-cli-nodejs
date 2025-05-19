# cd-cli
This is a modern Command-Line-Tool template repository base on Node.js. You can quickly set up your cli apps with this project.

REPL-based Dev Mode CLI, including the `dev` command and its `create` subcommand.

---

# 📘 Corpdesk CLI Reference – Development Mode

This document serves as the official reference for the Corpdesk Dev Mode CLI commands. It provides usage instructions, expected parameters, and examples for each available command.

---

## 🔧 Command: `dev`

Enters interactive development mode, allowing you to execute subcommands and interact with the application environment.

### ✅ Usage

```bash
dev
```

Once in dev mode, you'll enter an interactive REPL with a dynamic prompt.

---

### 🎨 Prompt Modes

Switch between REPL modes using the `.mode` command:

```bash
.mode default
.mode py
.mode js
```

#### Available Modes

| Mode      | Description                              |
| --------- | ---------------------------------------- |
| `default` | Basic development command prompt         |
| `py`      | Python-style prompt (for syntax clarity) |
| `js`      | JavaScript-style prompt                  |

---

### 📜 Multi-Command Support

You can chain multiple commands with semicolons:

```bash
create env --name dev-east --workstation workstation-01; show env --name dev-east;
```

---

## 🛠️ Subcommand: `create`

Sets up environment configurations dynamically.

### ✅ Usage

```bash
create env --name <profile-name> --workstation <hostname>;
```

### 📌 Description

Creates an environment profile (e.g., dev, staging) under a specific workstation context.

### 🧾 Options

| Option          | Description                              | Required |
| --------------- | ---------------------------------------- | -------- |
| `env`           | Keyword that specifies the resource type | ✅ Yes    |
| `--name`        | The environment profile name             | ✅ Yes    |
| `--workstation` | Target workstation name                  | ✅ Yes    |

### 🧪 Example

```bash
create env --name staging-01 --workstation george-laptop;
✔ Environment setup completed for profile: staging-01
```

### ❌ Error Example

```bash
create env
Error: Both --name and --workstation are required.
```

---

## 📚 Planned or Placeholder Subcommands

These commands are stubbed using `getSubcommand(...)`. Functionality may be extended in the future:

| Subcommand | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| `show`     | Likely for displaying resources                               |
| `sync`     | Possibly syncs environments or configurations                 |
| `exit`     | Exits development mode safely                                 |
| `create`   | Creates various resources (currently only `env` is supported) |

---

## 🔄 Exiting Dev Mode

Use the keyboard shortcut:

```
Ctrl + C (twice) or .exit
```

or run:

```
exit;
```

---

## 📈 Logging

All commands log their input and actions via the `CdLog` system.

---

## 📌 Future Improvements (Suggested)

* [ ] Autocomplete workstation or environment names
* [ ] Subcommand help output (`create --help`)
* [ ] Command history persistence
* [ ] Syntax highlighting or editor integration

---

Would you like this saved as a `.md` file or added to your CLI codebase directly as a documentation asset?


## Developer Quick Start

Repository: https://github.com/corpdesk/cd-cli-nodejs.git

```shell
# development
pnpm install
pnpm watch
pnpm ln -g # link your command globally so that you can debug easier.

# execute your global-linked command.
nppm link

# build
pnpm build
# make sure the end point for Coprdesk api is setup
# and is running
cd-cli login -u user-name -p password

# initialize template:
cd-cli template init --type=module-api --url=<module-template-repository>

# logout
cd-cli logout

# publish your package to npm.
pnpm changeset
pnpm versions
# manually trigger publish action(.github/workflows/publish.yml).
```

## Attention

Please read the documentations of these useful tools before developing, which avoids making repetitive wheels and helps you building your cli apps.

- [zx](https://github.com/google/zx) - Execute shell command conveniently in Node.js workflow.
- [commander](https://github.com/tj/commander.js) - Node.js command-line interfaces.
- [tsup](https://github.com/egoist/tsup) - A simple and fast builder based on esbuild.
- [changesets](https://github.com/changesets/changesets) - A way to manage your versioning and changelogs.
- and so do the other tools you'll develop with, please read the docs by yourself.

Here are some [command-line-apps](https://github.com/sindresorhus/awesome-nodejs?tab=readme-ov-file#command-line-apps) and [command-line-utilities](https://github.com/sindresorhus/awesome-nodejs?tab=readme-ov-file#command-line-utilities) you probably use, which are really wonderful.

## Contribution

PR welcome if you have any constructive suggestions. Please polish your code and  describe you commit msg concisely and detailedly.
