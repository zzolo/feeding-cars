/**
 * Scrapes data from Github to make RSS and JSON feeds.
 */

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var RSS = require('rss');
var collect = require('github-collect');

// Some global vars
var feedPath = path.join(__dirname, './feeds');
var refreshRate = 60;

// Make directory for feeds
try {
  fs.mkdirSync(feedPath);
}
catch (e) {
  if (e.code !== 'EEXIST') {
    throw e;
  }
}

// Get accounts to collect
var accounts = ['minnpost'];

// Get data from github
collect.get(accounts).done(function(data) {
  _.each(data, function(account, ai) {
    var xmlFeed;
    var file = account.login + '.repos.rss';
    var filePath = path.join(feedPath, file);

    // Create RSS object
    var feed = new RSS({
      title: 'Repos for account: ' + account.login,
      description: 'An RSS feed for Github code repositories for a specific account.',
      generator: 'feeding-cars',
      feed_url: 'feeds/' + file,
      site_url: account.html_url,
      pubDate: new Date(),
      ttl: refreshRate
    });

    // Add items to feed
    _.each(_.sortBy(account.objects.repos, 'created_at').reverse(), function(repo, ri) {
      feed.item({
        title: repo.name,
        description: repo.description,
        url: (repo.homepage) ? repo.homepage : repo.html_url,
        guid: repo.id,
        author: repo.owner.login,
        date: repo.created_at
      });
    });

    var xmlFeed = feed.xml(true);
    fs.writeFileSync(filePath, xmlFeed);
  });
});