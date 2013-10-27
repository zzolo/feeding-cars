# Feeding CARS

A simple application for providing feeds into the happenings of data journalism.  In short, it collects all the objects created by accounts on Github and creates RSS feeds for them.

## Install

* `npm install`

## Configure

Uses `rc` for vonfiguration so there are a number ways of having config values, but the following are using environment variables.

* `export feeding_cars_s3_key=XXXXXX`
* `export feeding_cars_s3_secret=XXXXXX`

## Run

* `node scrape.js`

## RSS files

Currently this uploads the RSS feeds to an S3 bucket in the form of:

* All repos for all accounts as defined in `scrape.js`: https://s3.amazonaws.com/data.minnpost/feeds/repos.rss
* One for each account as defined by: https://s3.amazonaws.com/data.minnpost/feeds/repos.ACCOUNT.rss