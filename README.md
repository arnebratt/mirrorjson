Mirrorjson
==========

Mirror and cache json data for offline work.

Description
===========

Mirrorjson is a Node.js server to take requests from a frontend client, pass the requests on to external server,
get the resulting data and store it in a database, then return the same data to the client.

If the external server can't be reached, Mirrorjson will return the last received data from the database.

Setup
=====

- Install Node.js and Mongo DB if you do not have it
- Clone Mirrorjson: git clone https://github.com/makingwaves/mirrorjson
- Install packages: cd mirrorjson && npm install
- Start Mirrorjson server: node server.js
- Add any domains you will need to your local hosts file (typically one for each project)

Usage
=====

You will find a very simple administration interface at [http://localhost:3001/mirrorjson](http://localhost:3001/mirrorjson).

By default it lists any domains configured. It also takes a couple of query parameters...

domain
------

Example: [http://localhost:3001/mirrorjson?domain=api.randomdomain.com](http://localhost:3001/mirrorjson?domain=api.randomdomain.com)

"domain" will add the specified domain to the database, matching it with your current domain and port
(which for our example is localhost:3001).

The example will show one element in the list, the newly added domain, as such:

    localhost:3001 <= api.randomdomain.com

This means that when you call or view [http://localhost:3001](http://localhost:3001), it will give you the json data
coming from api.randomdomain.com, mirroring whatever path you give it. Whenever the api.randomdomain.com server is
unavailable, it will return cached data.

jsondata
--------

Example: [http://localhost:3001/mirrorjson/?path=/test&jsondata={%22id%22:%20%22test%22,%22name%22:%20%22Test%201%22}](http://localhost:3001/mirrorjson/?path=/test&jsondata={%22id%22:%20%22test%22,%22name%22:%20%22Test%201%22})

"jsondata" will add the specified json data to the database manually, without going to the external server. This way,
you can manually configure whatever data is returned to your frontend client.

It requires an extra parameter "path" to specify the path that should return the given json data.

After calling the example here, you can open [http://localhost:3001/test](http://localhost:3001/test) and get
the following result: '{"id":"test","name":"Test 1"}'
