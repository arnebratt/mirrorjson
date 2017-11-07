MirrorJson
==========

Mirror and cache json data from external API's for offline work.

Description
===========

MirrorJson is a Node.js server to take requests from a frontend client, pass the requests on to external server,
get the resulting json data and store it in a database, then return the same data back to the client.

If the external server can not be reached, MirrorJson will return the last received data from the local database,
allowing a developer to work with the data offline. It also allows you to edit that json before it is sent to
your frontend client, or add mock json data to specified API paths.

Setup
=====

1. Install [Node.js](https://nodejs.org/en/download/) and [Mongo DB](https://docs.mongodb.com/manual/installation/) if you do not have it
2. Clone MirrorJson: **git clone https://github.com/makingwaves/mirrorjson**
3. Install packages: **cd mirrorjson && npm install**
4. Start MirrorJson server: **node server.js**

Usage
=====

Basic usage
-----------

After starting your server, open [http://localhost:3001/mirrorjson](http://localhost:3001/mirrorjson). This will show
you the MirrorJson administration interface. Your current address is localhost:3001, which must be matched with
your external API. To do this, add the API domain to the "Domain" field, for instance api.randomdomain.com , and
click "Save domain". You will now see the relation in the domain list, something like this:

    localhost:3001 <= api.randomdomain.com (view 0 stored documents)

If you now open [http://localhost:3001](http://localhost:3001), it will give you the json data coming from
api.randomdomain.com . This json data will also be stored in the local MongoDB database. If you now loose connection
with the external API (for instance by disabling your internet access), MirrorJson will serve you the json data
stored locally.

You can also manually set json code on any specified path, and let MirrorJson return your json data instead of
the data from external server. Or edit the json that comes from external server before it is sent to your frontend
system. This gives you easy access to debug your frontend code. By clicking on each stored element hash you open
the built in json editor.

### Example ###

Add the domain "raw.githubusercontent.com" on the admin frontpage:

    localhost:3001 <= raw.githubusercontent.com (view 0 stored documents)

Open [http://localhost:3001/makingwaves/mirrorjson/master/package.json](http://localhost:3001/makingwaves/mirrorjson/master/package.json).
MirrorJson Admin will now show "localhost:3001 <= raw.githubusercontent.com (view 1 stored documents)". If you click the
link on "(view 1 stored documents)", it will show you a list of stored documents based on a hash from the path.
Here you can manually add json data for any specific path, or click on the hash to edit the json returned from
the external API.

If the external API requires https, you can set up the relation as "https&#58;//raw.githubusercontent.com".

Multiple API's
--------------

### By host ###

Add any domains you will need to your [local hosts file](https://www.howtogeek.com/howto/27350/beginner-geek-how-to-edit-your-hosts-file/)
(typically one for each external API, all should have IP *127.0.0.1*):

    127.0.0.1 api.randomdomain.localhost

Open [http://api.randomdomain.localhost:3001/mirrorjson](http://api.randomdomain.localhost:3001/mirrorjson) and add your external
API domain like before.

### By port ###

Start the MirrorJson server with the port parameter, for instance:

    node server --port=3002

You can now open [http://localhost:3002/mirrorjson](http://localhost:3002/mirrorjson), and match your external API domain
to this address. For multiple projects, you need to start one server for each port.

### By host and port ###

For complex projects you can combine multiple hosts and ports, matching each combination with an external API.

Todo
====

* Handle non-JSON data more gracefully (specifically for HTTP OPTIONS)
* Refactor error situations to use exceptions and return json
* Add support for XML?
