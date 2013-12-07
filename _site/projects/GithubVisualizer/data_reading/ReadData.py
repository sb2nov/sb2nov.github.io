# Sourabh Bajaj
# Read the data from github and dump into csv
# Test data - organization used is Balanced
import urllib2
import urllib
import json
import csv

CI = ''
CS = ''

# req = urllib2.Request('https://api.github.com/orgs/balanced/members')
# response = urllib2.urlopen(req)
# user_data = json.loads(response.read())
# ls_users = []
# for d_data in user_data:
#     ls_users.append(str(d_data['login']))

# req = urllib2.Request('https://api.github.com/orgs/balanced/repos')
# response = urllib2.urlopen(req)
# repo_data = json.loads(response.read())
# ls_repos = []
# for d_data in repo_data:
#     ls_repos.append(str(d_data['name']))

ls_repos = ['balanced-python', 'balanced-ruby', 'balanced-php', 'active_merchant', 'fakeredis', 'balanced-api', 'balanced-js', 'django-balanced', 'status.balancedpayments.com', 'balanced.github.com', 'balanced-docs', 'balanced-java', 'django-example', 'rentmybikes', 'balanced-ios', 'balanced-dashboard', 'billy', 'rentmybikes-rails', 'www.balancedpayments.com', 'rentmybikes-node', 'balanced-csharp', 'balanced-node', 'hubot', 'BalBot', 'balanced-android', 'gatekeeper']

ls_users = set(['mahmoudimus', 'matin', 'msherry', 'mjallday', 'jkwade', 'bninja', 'timnguyen', 'dmdj03'])

# ls_repos = ['rentmybikes']
ls_repos = ls_repos[20:]

s_last_sha = ''

csvwriter = csv.writer(open('balancedData4.csv', 'w'))
for s_repo in ls_repos:
    
    b_flag=True
    s_url = 'https://api.github.com/repos/balanced/' + s_repo + '/commits?client_id='+CI+'&client_secret='+CS+'&page='
    i = 1
    
    html_repo_url = 'https://github.com/balanced/' + s_repo
    
    while(b_flag):
        s_full_url = s_url + str(i) + '&per_page=100'

        if i > 1:
            s_full_url = s_full_url + '&sha=' + s_last_sha
            
        req = urllib2.Request(s_full_url)
        response = urllib2.urlopen(req)
        ld_data = json.loads(response.read())
        
        s_last_sha = ld_data[-1]['sha']
        
        if len(ld_data) < 100:
            b_flag = False
        
        for j, d_data in enumerate(ld_data):
            if (i > 1) and (j==0):
                continue

            try:
                s_commit_url = 'https://api.github.com/repos/balanced/' + s_repo + '/commits/' + d_data['sha'] + '?client_id='+CI+'&client_secret='+CS
                req_commit = urllib2.Request(s_commit_url)
                resp_commit = urllib2.urlopen(req_commit)
                d_commit = json.loads(resp_commit.read())
                
                internal = 1
                if str(d_commit['author']['login']) not in ls_users:
                    internal = -1
                    
                ls_line = [s_repo, d_commit['author']['login'], internal, d_commit["commit"]['author']['name'], d_commit["commit"]['author']['date'], d_commit["stats"]['additions'], d_commit["stats"]['deletions'], d_commit['stats']['total'], d_commit['commit']['message'], d_commit['committer']['html_url'], html_repo_url]
                csvwriter.writerow(ls_line)
            except:
                pass
            
        i = i + 1