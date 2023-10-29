import {Injectable} from '@angular/core';
import {ReplaySubject} from "rxjs";

export type Run = { ownerName: string, icon: string, url: string, workflowName: string, createdAt: Date };

@Injectable({
  providedIn: 'root'
})
export class GithubService {

  runs = new ReplaySubject<Run[]>(1);
  lastUpdate = new ReplaySubject<Date>(1);

  constructor() {
    this.observeGithubActions();
  }

  private async observeGithubActions() {
    await this.refresh();
    setInterval(async () => await this.refresh(), 60000);
  }

  private async refresh() {
    const runs = await this.getRuns();
    this.runs.next(runs);
    this.lastUpdate.next(new Date());
  }

  private async getRuns(): Promise<Run[]> {
    const results = [];
    let hasNext;
    let after = null;
    do {
      const response = await this.requestRuns(after, "xbauquet", ["inatysco"]);
      results.push(...response.results);
      hasNext = response.pageInfo.hasNextPage;
      after = response.pageInfo.endCursor;
    } while (hasNext);
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results.slice(0, 10);
  }

  private async requestRuns(after: string, user: string, orgs: string[]) {
    after = after ? '"' + after + '"' : 'null';
    let userOrgQuery = user ? 'user:' + user : '';
    if (orgs != null) {
      for (const org of orgs) {
        userOrgQuery = userOrgQuery + ' org:' + org;
      }
    }
    const query = `
    {
      search(query: "${userOrgQuery}", type: REPOSITORY, last: 100, after: ${after}) {
        pageInfo {
          startCursor
          hasNextPage
          endCursor
        }
        edges {
          node {
            ... on Repository {
              nameWithOwner
              defaultBranchRef {
                target {
                  ... on Commit {
                    checkSuites(last: 10) {
                      nodes {
                        conclusion
                        createdAt
                        url
                        workflowRun {
                          workflow {
                            name
                            state
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `;
    const url = 'https://api.github.com/graphql';
    const headers = {
      'Authorization': 'Bearer ' + "d48bc4268987aa07de84cffcb62b9653fca5d0fc"
    };
    const response = await fetch(url, {method: "POST", body: JSON.stringify({query}), headers: headers});
    const result = await response.json() as any;
    const edges = result.data.search.edges;
    const values: Run[] = [];

    for (let edge of edges) {
      if (!edge.node.defaultBranchRef) {
        continue;
      }
      const checkSuites = edge.node.defaultBranchRef.target.checkSuites.nodes;
      if (checkSuites.length <= 0) {
        continue;
      }
      for (let checkSuite of checkSuites) {
        if (!checkSuite.conclusion) {
          continue;
        }
        let icon;
        switch (checkSuite.conclusion.toLowerCase()) {
          case "success":
            icon = 'assets/green-dot.png';
            break;
          case "failure":
            icon = 'assets/red-dot.png';
            break;
          case "timed_out":
            icon = 'assets/red-dot.png';
            break;
          default:
            icon = 'assets/grey-dot.png';
            break;
        }

        values.push(
          {
            ownerName: edge.node.nameWithOwner,
            icon,
            url: checkSuite.url,
            workflowName: checkSuite.workflowRun.workflow.name,
            createdAt: new Date(checkSuite.createdAt)
          }
        );

      }

    }
    return {results: values, pageInfo: result.data.search.pageInfo};
  }
}
