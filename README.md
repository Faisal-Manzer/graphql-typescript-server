![Server Test](https://github.com/Faisal-Manzer/graphql-typescript-server/workflows/Server%20Test/badge.svg)
# GraphQL Server boilerplate
Written in TypeScript with role based access

## Installing and Running
Requirements for running the project are:
- PostgreSQL (tested on v10.12)
- Redis (tested on v4.0.9)

```
git clone https://github.com/Faisal-Manzer/graphql-typescript-server server
cd server
cp .env.example .env
yarn install
```

<details><summary>Install and start PostgreSQL</summary>
<p>

Installing on --- On Linux
```shell
sudo apt install postgresql postgresql-contrib -y

```

Installing on --- On MacOS
```shell
brew install postgresql
```

Configure PostgreSQL
```shell
sudo -u postgres psql
CREATE DATABASE "server";
CREATE DATABASE "test-server";
CREATE USER username WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE "server" TO username;
GRANT ALL PRIVILEGES ON DATABASE "test-server" TO username;
\q
```

</p>
</details>


<details><summary>Install and start Redis</summary>
<p>

Installing on --- On Linux
```shell
sudo apt install redis -y

```

Installing on --- On MacOS
```shell
brew install redis
```
</p>
</details>

Add your credential to `.env`. You can create your secret key [here](https://djecrety.ir/).

## Testing
```shell
yarn test
```

## Credits
This is inspired by this excelent repo https://github.com/benawad/graphql-ts-server-boilerplate. 
You can learn to create this from scratch https://www.youtube.com/playlist?list=PLN3n1USn4xlky9uj6wOhfsPez7KZOqm2V.
