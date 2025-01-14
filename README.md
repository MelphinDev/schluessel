# schluessel
![Node.js CI](https://github.com/Pik-9/schluessel/workflows/Node.js%20CI/badge.svg?branch=master&event=push)
![npm](https://img.shields.io/npm/v/schluessel)
![GitHub](https://img.shields.io/github/license/Pik-9/schluessel)
[![CodeFactor](https://www.codefactor.io/repository/github/melphindev/schluessel/badge)](https://www.codefactor.io/repository/github/melphindev/schluessel)

Node.js package for storing application credentials (API keys, database passwords, etc.) encrypted in your repository.

## Introduction
In complex applications you often have several credentials like database passwords, API keys, etc. you need to store
somehow without accidentally checking them into your git repo or publishing them with your npm package.  
The popular framework _Ruby on Rails_ has a
[very neat solution](https://medium.com/craft-academy/encrypted-credentials-in-ruby-on-rails-9db1f36d8570)
for this dilemma:
The credentials get enciphered and written to a file that can be checked into the repository.
In order for the application to access them, you need to hand over the master key to decipher them.

### Where does the name come from?
"Schlüssel" is the German  word for **key(s)**. _The singular and plural forms are identical here_.  
:de: :key:

## How it works
`schluessel` will store your credentials in a JSON formatted file and create a respective keyfile
for every environment (`NODE_ENV`).
It is safe to check in your credentials file (`credentials.<NODE_ENV>.json.enc`) into your
version control, but make sure to **never publish** the key file!  
The default environment - if not specified otherwise - is _development_.

### Install `schluessel`
Just install `schluessel` by typing from your project root directory:
```bash
npm install --save schluessel
```

### Accessing the credentials
Credentials are stored in JSON format.
Let's assume you have the following credentials:
```json
{
  "_description": "Put your credentials here...",
  "database": {
    "username": "admin",
    "password": "topsecret"
  }
}
```

#### CommonJS
From within your application do:
```javascript
const myCredentials = require('schluessel');

// myCredentials will be the object you defined above in JSON format.
const dbConnection = connectToDatabase(
  myCredentials.database.username,
  myCredentials.database.password
);
```

#### ECMA Modules
From within your application do:
```javascript
import myCredentials from 'schluessel';

// myCredentials will be the object you defined above in JSON format.
const dbConnection = connectToDatabase(
  myCredentials.database.username,
  myCredentials.database.password
);
```

#### TypeScript
In a [TypeScript](https://www.typescriptlang.org/) project you need to install `@types/schluessel` first:
```bash
npm install --save-dev @types/schluessel
```

Then you can access your credentials like this:
```typescript
import myCredentials = require('schluessel');
```
The resulting object `myCredentials` is of type `any` since it's structure is completely up to you
and cannot be predicted.


That's it! :sparkles:

### Creating a vault and key file
`schluessel` has a CLI that can be invoked with `npx`:
```bash
npx schluessel new
```
This will create a new vault and keyfile in your project root directory for the _development_ environment.  

**ATTENTION: It is important to `cd /path/to/your/project/root` before you execute the code above!**
The CLI script cannot determine your project root on its own, so it's just using the _current working directory_.

This command will also add the line `credentials.*.key` to your `.gitignore` (and `.npmignore` if it exists)
to make sure that you really will never check in the keyfile.

### Editing the credentials
Just type:
```bash
npx schluessel edit
```
This will decipher the vault file and let you edit it with your favorite text editor.
It will be enciphered again as soon as you close the editor.

## Security considerations
The encryption algorithm used is AES with a 256 bit key in [Galois/Counter Mode](https://en.wikipedia.org/wiki/Galois/Counter_Mode).

### Environments
You often have totally different credentials during development, testing and the final deployment.
You can (and should) create a credentials and key file pair for every single node environment you're about
to use. The default is _development_.

If you want to create a vault and key file for another environment, just do:
```bash
NODE_ENV=<your environment> npx schluessel new
```

And respectively to edit the credentials:
```bash
NODE_ENV=<your environment> npx schluessel edit
```

### Key handling
I cannot stress enough how crucial it is that you never upload the key file anywhere.
For deploying I would recommend creating a separate `NODE_ENV` (e.g. `production`) and place the key file for
this environment (and only for this one) on your server manually.  
If you cannot or don't want to place a file on your server, you can also _pass it via an environment variable_:
```bash
NODE_ENV=<your environment> NODE_MASTER_KEY="mqkMGRLfY+GwjnlXOlIzJw+tlip/SBny/QOlDHQltEM=" node my_awesome_app.js
```
:four_leaf_clover:

This should be obvious, but if you loose your key file, the respective credentials will be lost forever! :fire:

Note: All binary data is encoded in _base64_.

### Changing IVs
Every time you edit the credentials, a new _Initialisation Vector_ will be used resulting in completely differnt
ciphertexts even for very small changes. This will prevent attackers from searching for patterns in your
`credentials.<NODE_ENV>.json.enc` across several save states.
