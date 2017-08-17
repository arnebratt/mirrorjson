MirrorJson
==========

Mirror and cache json data from external API's for offline work.

Description
===========

MirrorJson is a Node.js server to take requests from a frontend client, pass the requests on to external server,
get the resulting data and store it in a database, then return the same data back to the client.

If the external server can not be reached, MirrorJson will return the last received data from the local database,
allowing a developer to work with the data offline.

Setup
=====

- Install [Node.js](https://nodejs.org/en/download/) and [Mongo DB](https://docs.mongodb.com/manual/installation/) if you do not have it
- Clone MirrorJson: git clone https://github.com/makingwaves/mirrorjson
- Install packages: cd mirrorjson && npm install
- Start MirrorJson server: node server.js
- Add any domains you will need to your [local hosts file](https://www.howtogeek.com/howto/27350/beginner-geek-how-to-edit-your-hosts-file/)
(typically one for each project, all should have IP 127.0.0.1), or use different ports with the optional --ports parameter

Usage
=====

MirrorJson matches whatever domain/port combination you call it from (default "localhost:3001") to an external API.
First you need to configure which external domain it should match with. Then you can open [http://localhost:3001](http://localhost:3001)
and it will return the json data from that external domain, matching any path or query parameters you add.

You will find a simple administration interface at [http://localhost:3001/mirrorjson](http://localhost:3001/mirrorjson),
where you can specify the address for your external API. For instance, if you add the domain 'api.randomdomain.com' here,
it will show this match in the list:

    localhost:3001 <= api.randomdomain.com (view 0 stored elements)

Then you can open [http://localhost:3001](http://localhost:3001), and get whatever json the API at
api.randomdomain.com returns, or open [http://localhost:3001/test](http://localhost:3001/test) to get
the json from http://api.randomdomain.com/test . After these urls are called the first time, you can disable
your internet access and still receive the json data from them.

You can also manually set json code on any specified path, and let MirrorJson return your json data instead of
the data from external server. Or edit the json that comes from external server before it is sent to your frontend
system. By clicking on each stored element hash you come to the built in json editor.

Todo
====

* Remove elements functionality
* Remove elements when remote domain is removed
* Handle PUT
* Handle cookies
* Add support for XML?
