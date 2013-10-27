/**
 * Scrapes data from Github to make RSS and JSON feeds.
 */

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var RSS = require('rss');
var collect = require('github-collect');

// Some global vars
var feedPath = path.join(__dirname, './tmp');
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
var accounts = ['minnpost', 'nytimes', 'propublica', 'datadesk', 'texastribune', 'guardianinteractive', 'newsapps', 'nprapps'];

// Get data from github
collect.get(accounts).done(function(data) {
  // Set up for global feed
  var reposFile = 'repos.rss';
  var reposFilePath = path.join(feedPath, reposFile);
  var reposFeed = new RSS({
    title: 'Repos for all acounts',
    description: 'An RSS feed for Github code repositories for all acounts.',
    generator: 'feeding-cars',
    feed_url: 'feeds/' + reposFile,
    site_url: '',
    pubDate: new Date(),
    ttl: refreshRate
  });
  var reposItems = [];

  // Go through each account and make individual feed
  _.each(data, function(account, ai) {
    var repoFile = 'repos.' + account.login + '.rss';
    var repoFilePath = path.join(feedPath, repoFile);

    // Create RSS object
    var repoFeed = new RSS({
      title: 'Repos for account: ' + account.login,
      description: 'An RSS feed for Github code repositories for a specific account.',
      generator: 'feeding-cars',
      feed_url: 'feeds/' + repoFile,
      site_url: account.html_url,
      pubDate: new Date(),
      ttl: refreshRate
    });

    // Add items to feed
    _.each(_.sortBy(account.objects.repos, 'created_at').reverse(), function(repo, ri) {
      var item = {
        title: repo.name,
        description: repo.description,
        url: (repo.homepage) ? repo.homepage : repo.html_url,
        guid: repo.id,
        author: repo.owner.login,
        date: repo.created_at
      };
      repoFeed.item(item);
      reposItems.push(item);
    });

    // Write out file
    fs.writeFileSync(repoFilePath, repoFeed.xml(true));
  });

  // Sort all items by date and add to global feed
  _.each(_.sortBy(reposItems, 'date').reverse(), function(item, ii) {
    reposFeed.item(item);
  });

  // Write out global feed
  fs.writeFileSync(reposFilePath, reposFeed.xml(true));
});