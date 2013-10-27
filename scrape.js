/**
 * Scrapes data from Github to make RSS and JSON feeds.
 */

var fs = require('fs');
var path = require('path');
var rc = require('rc');
var _ = require('lodash');
var RSS = require('rss');
var collect = require('github-collect');
var knox = require('knox');

// Get configuration
var env = require('rc')('feeding_cars', {
  s3_key: '',
  s3_secret: ''
});

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
var accounts = ['minnpost', 'nytimes', 'propublica', 'datadesk', 'texastribune', 'guardianinteractive', 'newsapps', 'nprapps', 'wnyc'];

// S3 client
var s3Client = knox.createClient({
  key: env.s3_key,
  secret: env.s3_secret,
  bucket: 'data.minnpost'
});
var s3Path = 'feeds';

// Get data from github
collect.get(accounts).done(function(data) {
  var created;

  // Set up for global feed
  var reposFile = 'repos.rss';
  var reposFilePath = path.join(feedPath, reposFile);
  var reposFeed = new RSS({
    title: 'Feeding CARs',
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

  // Export to S3
  created = fs.readdirSync(feedPath);
  _.each(created, function(file, fi) {
    var localPath = path.join(feedPath, file);
    s3Client.putFile(localPath, s3Path + '/' + file, {
      'x-amz-acl': 'public-read'
    }, function(error, result) {
      // do something here
    });
  });
});