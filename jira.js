const request = require('request')

module.exports.getIssue = function (jiraurl, jirau, jirap, issue) {
  return new Promise((resolve, reject) => {
    if (issue === undefined) {
      reject(new Error('ERROR: need to provide issue'))
    } else {
      const URL = jiraurl + '/rest/api/2/search?jql=key=' + issue + '&startAt=0&maxResults=15&fields=summary,issuetype,assignee,status,priority,key,changelog&expand=changelog'
      console.log('fetching issue ' + issue)
      request(
        {
          url: URL,
          headers: {
            'Authorization': 'Basic ' + new Buffer(jirau + ':' + jirap).toString('base64')
          }
        },
        function (error, response, results) {
          if (error) {
            console.error('Error: ' + error)
          } else {
            var jiraData = JSON.parse(results)
            if (jiraData.issues === undefined) {
              reject(new Error('Error: Issue ' + issue + ' not found'))
            } else {
              // var changelog = jiraData.issues[0].changelog
              resolve(jiraData.issues[0])
            }
          }
        }
      )
    }
  })
}

// Developers usually paste the diff url into Slack:
// https://bitbucket.org/REPNAME/web-vnow/pull-requests/290/username-vnow-6234-dropbox-develop/diff
// need to parse out:
//  - repo slug (e.g. web-vnow)
//  - the PR number (in this case, 290) so we can surf through the activity log to see who already approved
module.exports.getPRStatusString = function (bbUrl, jirau, jirap, bitBucketDiffURL) {
  return new Promise((resolve, reject) => {
    if (bitBucketDiffURL === undefined) {
      reject(new Error('Need to provide a bitbucket diff url'))
    } else {
      if (process.env.BITBUCKET_DIFF_URL_PREFIX === undefined) {
        reject(new Error('BITBUCKET_DIFF_URL_PREFIX env variable not set'))
      } else {
        if (bitBucketDiffURL.indexOf(process.env.BITBUCKET_DIFF_URL_PREFIX) !== 0) {
          reject(new Error('Error: given URL did not start with BITBUCKET_DIFF_URL_PREFIX'))
        }
        var projectURL = bitBucketDiffURL
        var projectSlug = projectURL.replace(process.env.BITBUCKET_DIFF_URL_PREFIX, '')
        projectSlug = projectSlug.substr(0, projectSlug.indexOf('/'))
        console.log('projectSlug=' + projectSlug)
        // get the PR (it's the first number between slashes)
        projectURL.replace(projectSlug + '/', '')

        var pattern = /(\d+)/ig
        var match = projectURL.match(pattern)

        if (match === undefined) {
          reject(new Error('Cannot find the pr number in [' + projectURL + ']'))
        }

        // this URL shows the activity (comments, history of reviewers, etc...)
        // const URL = process.env.BITBUCKET_URL + projectSlug + '/pullrequests/' + match[0] + '/activity'
        const URL = process.env.BITBUCKET_URL + projectSlug + '/pullrequests/' + match[0]
        console.log(URL)
        // const URL = 'https://api.bitbucket.org/2.0/repositories/inmotionnow/web-vnow/default-reviewers' // Forbidden
        console.log('fetching pull requests URL: ' + URL)
        request(
          {
            url: URL,
            headers: {
              'Authorization': 'Basic ' + new Buffer(jirau + ':' + jirap).toString('base64')
            }
          },
          function (error, response, results) {
            if (error) {
              console.error('Error: ' + error)
            } else {
              var jiraData = JSON.parse(results)
              var retStr = ''
              for (let participant of jiraData.participants) {
                retStr += participant.approved ? ':jira-checkbox-checked:' : ':jira-checkbox:'
                retStr += participant.user.display_name + '   '
              }
              resolve(retStr)
            }
          }
        )
      }
    }
  })
}

// console.log('Querying: ' + QUERY_STR)
// console.time('query')
// request(
//     {
//         url: URL,
//         headers: {
//             "Authorization": "Basic " + new Buffer(opt.username + ":" + opt.password).toString("base64")
//         }
//     },
//     function (error, response, results) {
//         // results is already json data
//         var jiraData = JSON.parse(results)
//         var changelog = jiraData.issues[0].changelog
//         console.timeEnd('query')
//     }
// )
