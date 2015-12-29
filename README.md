![Logo](https://cloud.githubusercontent.com/assets/3422014/12037101/c4b76812-ae19-11e5-881e-61981fe662c6.png)

Airwatch is an open web application that consumes data from the AirNow API (https://docs.airnowapi.org/Data/query) and allows a visitor to view the reported events on a map.

Type | URL
---- | ---
Release :sunny: | http://airwatch-proxy.airwatch-stack.sjmatta.svc.tutum.io/
Master Branch :rocket: | http://airwatch-proxy-snapshot.airwatch-stack-snapshot.sjmatta.svc.tutum.io/

[![Build Status](https://circleci.com/gh/ditinc/airwatch/tree/master.png?style=shield&circle-token=77901e712e4694dcd2db7422c8298a9cadc4b5bc)](https://circleci.com/gh/ditinc/airwatch)
[![Code Climate](https://codeclimate.com/repos/56703c8d99072c0e9a000d04/badges/6ee0d7cc05902e4cbe62/gpa.svg)](https://codeclimate.com/repos/56703c8d99072c0e9a000d04/feed)

## Team and Development Process
- DevOps and Project Lead: sjmatta
- Developer: treyyoder
- Senior Software Consultant and Scrum Master: etrudeau

Our development process requires selection of a project lead to run the project.  This individual is ultimately responsible for project success and product quality.  A senior software consultant assists by coaching the team during sprint planning, daily scrums, and independent reviews.  On most projects, DevOps would be a separate team member, but due to the small size of this project, the lead handles the DevOps setup and tweaks.  We conduct code review directly in GitHub through comments and issues and in our [Slack](http://slack.com) collaboration environment.  Issues are automatically synced with [Waffle.io](https://waffle.io/) Agile boards.

## Technology Stack
Airwatch is built on [Meteor.js](https://www.meteor.com/) and [MongoDB](https://www.mongodb.org/) using [Leaflet](http://leafletjs.com/) and [OpenStreetMaps](https://www.openstreetmap.org) as the mapping layer and map provider, with [Twitter Bootstrap](http://getbootstrap.com/) as the CSS framework.  We leverage [CircleCI](https://circleci.com/) for continuous integration.  The app is deployed in a [Docker](https://www.docker.com/) container hosted on [DigitalOcean](https://www.digitalocean.com/).  We leverage [Tutum](https://www.tutum.co/) to manage the Docker container on DigitalOcean.

Most of the technologies in Airwatch are free and open source.  However, several tools used in the development process are only free to use on open source projects.  These include Tutum, CircleCI, and [NewRelic](http://newrelic.com/).  The software licensing is as follows:

- Meteor: MIT
- Jasmine: MIT
- Leaflet: BSD
- MongoDB: GNU AGPL v3.0
- OpenStreetMap: ODbL
- HAProxy: GPL v2.0
- Docker: Apache 2.0
- Twitter Bootstrap: MIT

Use of Airwatch is limited by the licensing of its component parts.  The Airwatch source code is licensed under GPL v3.0.

### Continuous Integration

Automated continuous integration and deployment is managed through [CircleCI](https://circleci.com). On commit to the Master branch, the code is automatically deployed to [Docker Hub](https://hub.docker.com).  [Tutum](https://www.tutum.co/) describes the container configuration, layout, and relationships, and automatically downloads/starts the Docker containers on a node at DigitalOcean.

For additional details, please see the wiki.

### Configuration Management

Configuration for the app (Meteor in .meteor), CircleCI (circle.yml), and Tutum (tutum.yml) are managed through their respective config files in the repo. Confidential information (passwords, etc.) are stored as environmental variables in CircleCI and aren't available in GitHub.

### Continuous Monitoring

The release containers are monitored by New Relic. The Tutum stack consists of 2 HAProxy (http://www.haproxy.org/) containers -- one for production/release, and one for the master branch, doing round robin load balancing to 4 Airwatch containers. Each set of 2 Airwatch containers share a MongoDB container. Two New Relic containers monitor half of the running containers each.

### Unit Tests

Unit tests are written using Jasmine and run using the Velocity test runner for Meteor.  CircleCI runs the unit tests as part of the build/deploy process. See the Development section to run the unit tests.

### Development
1. [Install Meteor](https://www.meteor.com/install)
2. Clone this project
3. ```cd``` into the project directory
4. Optionally run unit tests: ```meteor --test```
5. Run the project: ```meteor```
6. Go to http://localhost:3000/

### Running
[![Deploy to Tutum](https://s.tutum.co/deploy-to-tutum.svg)](https://dashboard.tutum.co/stack/deploy/)

There are several ways to run the application. You can use the badge above to create the Tutum stack (some environmental variables required), follow the instructions in the Development section, or launch the Docker container with the directions below:

1. Set the following environmental variable
  * SSL_CERT: Base64-encoded DER private key and certificate, all on one line, with the text ```\n``` replacing line separators
2. Launch the required Mongo database: ```docker run -d --name mongo mongo```
3. Launch the Airwatch container: ```docker run -d --name airwatch --link mongo:mongo -e ROOT_URL=http://localhost -p 80:80 sjmatta/airwatch```
4. Navigate to http://localhost/

### Credits
Hot Air Balloon graphic by <a href="http://www.freepik.com/">Freepik</a> from <a href="http://www.flaticon.com/">Flaticon</a> is licensed under <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>. Made with <a href="http://logomakr.com" title="Logo Maker">Logo Maker</a>
* [Edit logo](http://logomakr.com/5PMD6w)
