# Quiz

A server for a multiplayer quiz game. Uses express and rethinkdb. Made for a ionic workshop.

## Requirements

Quiz uses [rethinkdb](http://www.rethinkdb.com/). Make sure you have it [installed](http://www.rethinkdb.com/docs/install/) before running the Quiz server.
Also make sure you have npm installed.

# Endpoints

## Registration

```
POST /register
```

Registers a user.

Params:

* `username` [required]
* `password` [required]

Example:

```
curl -H 'Content-Type: application/json' -d '{"username": "gabrielpoca", "password": "123456" }' localhost:3000/register
```

## Profile

```
GET /me
```

Retrieves the logged user's information. (Requires basic auth.)

## Users

```
GET /users
```

Retrieves the list of registered users. (Requires basic auth.)

## Answers

```
POST /answers
```

Submits an answer to a question. (Requires basic auth.)

Params:

* `questionId` [required]
* `answerId` [required]

