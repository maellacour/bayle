# How to build the bayle cli

### Prerequisite

- Node.js installed

Install the `pkg` tool globaly to create executables which can run on linux, mac and windows.

```shell
npm install -g @yao-pkg/pkg
```

Install the packages

```shell
yarn workspaces focus @bayle/cli
```

Run the `pkg` tool to create the bayle executables

```shell
pkg cli/package.json --compress Brotli --output bayle
```

Rename the linux and windows executables

```shell
mv bayle-linux bayle
mv bayle-win.exe bayle.exe
```

The bayle cli is ready to use!
