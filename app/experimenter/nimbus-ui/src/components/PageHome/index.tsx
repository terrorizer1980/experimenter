/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useQuery } from "@apollo/client";
import { Link, RouteComponentProps } from "@reach/router";
import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import { GET_EXPERIMENTS_QUERY } from "../../gql/experiments";
import { getAllExperiments_experiments } from "../../types/getAllExperiments";
import AppLayout from "../AppLayout";
import Head from "../Head";
import PageLoading from "../PageLoading";
import DirectoryTable, {
  DirectoryCompleteTable,
  DirectoryDraftsTable,
  DirectoryLiveTable,
} from "./DirectoryTable";
import sortByStatus from "./sortByStatus";

type PageHomeProps = {} & RouteComponentProps;

export const Body = () => {
  const { data, loading } = useQuery<{
    experiments: getAllExperiments_experiments[];
  }>(GET_EXPERIMENTS_QUERY);

  if (loading) {
    return <PageLoading />;
  }

  if (!data) {
    return <div>No experiments found.</div>;
  }

  const { live, complete, preview, review, draft } = sortByStatus(
    data.experiments,
  );
  return (
    <Tabs defaultActiveKey="active">
      <Tab eventKey="active" title="Active">
        <div className="mt-4">
          <DirectoryLiveTable title="Live Experiments" experiments={live} />
          <DirectoryTable title="In Review" experiments={review} />
          <DirectoryTable title="In Preview" experiments={preview} />
        </div>
      </Tab>
      <Tab eventKey="completed" title="Completed">
        <div className="mt-4">
          <DirectoryCompleteTable title="Completed" experiments={complete} />
        </div>
      </Tab>
      <Tab eventKey="drafts" title="Drafts">
        <div className="mt-4">
          <DirectoryDraftsTable title="Drafts" experiments={draft} />
        </div>
      </Tab>
    </Tabs>
  );
};

const PageHome: React.FunctionComponent<PageHomeProps> = () => {
  return (
    <AppLayout testid="PageHome">
      <Head title="Experiments" />

      <div className="d-flex mb-4">
        <h2 className="mb-0 mr-1">Nimbus Experiments </h2>
        <div>
          <Link
            to="new"
            data-sb-kind="pages/New"
            className="btn btn-primary btn-small ml-2"
          >
            Create new
          </Link>
        </div>
      </div>

      <Body />
    </AppLayout>
  );
};

export default PageHome;
