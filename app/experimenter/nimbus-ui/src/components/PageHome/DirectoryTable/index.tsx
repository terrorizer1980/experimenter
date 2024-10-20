/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Link } from "@reach/router";
import React from "react";
import { getProposedEnrollmentRange, humanDate } from "../../../lib/dateUtils";
import { getAllExperiments_experiments } from "../../../types/getAllExperiments";
import LinkExternal from "../../LinkExternal";
import NotSet from "../../NotSet";

// These are all render functions for column type sin the table.
export type ColumnComponent = React.FC<getAllExperiments_experiments>;

export const DirectoryColumnTitle: React.FC<
  getAllExperiments_experiments & { subPath?: string; sbLink?: string }
> = ({ slug, name, subPath = "", sbLink = "pages/Summary" }) => {
  return (
    <td className="w-33" data-testid="directory-table-cell">
      <Link
        to={slug + subPath}
        data-sb-kind={sbLink}
        data-testid="directory-title-name"
      >
        {name}
      </Link>
      <br />
      <span
        className="text-monospace text-secondary small"
        data-testid="directory-title-slug"
      >
        {slug}
      </span>
    </td>
  );
};

export const DirectoryColumnOwner: ColumnComponent = ({ owner }) => (
  // #4380 made it so owner is never null, but we have experiments pre-this
  // that may be absent an owner, so keep this fallback in place.
  <td data-testid="directory-table-cell">{owner?.username || <NotSet />}</td>
);

export const DirectoryColumnFeature: ColumnComponent = ({ featureConfig }) => (
  <td data-testid="directory-table-cell">
    {featureConfig ? (
      <>
        <span data-testid="directory-feature-config-name">
          {featureConfig.name}
        </span>
        <br />
        <span
          className="text-monospace text-secondary small"
          data-testid="directory-feature-config-slug"
        >
          {featureConfig.slug}
        </span>
      </>
    ) : (
      <span data-testid="directory-feature-config-none">(None)</span>
    )}
  </td>
);

interface Column {
  /** The label of the column, which shows up in <th/> */
  label: string;
  /** A component that renders a <td/> given the experiment data */
  component: ColumnComponent;
}

interface DirectoryTableProps {
  title: string;
  experiments: getAllExperiments_experiments[];
  columns?: Column[];
}

const DirectoryTable: React.FunctionComponent<DirectoryTableProps> = ({
  title,
  experiments,
  columns: customColumns,
}) => {
  const columns = customColumns || [
    { label: title, component: DirectoryColumnTitle },
    { label: "Owner", component: DirectoryColumnOwner },
    { label: "Feature", component: DirectoryColumnFeature },
  ];
  return (
    <div className="directory-table pb-2" data-testid="DirectoryTable">
      <table className="table">
        <thead>
          <tr>
            {experiments.length ? (
              columns.map(({ label }, i) => (
                <th
                  className={`border-top-0 ${
                    i === 0 ? "font-weight-bold" : "font-weight-normal"
                  }`}
                  key={label}
                  data-testid="directory-table-header"
                >
                  {label}
                </th>
              ))
            ) : (
              <th
                colSpan={columns.length}
                className="border-top-0 font-weight-bold"
                data-testid="directory-table-header"
              >
                {columns[0].label}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {experiments.length ? (
            experiments.map((experiment) => (
              <tr key={experiment.slug} data-testid="directory-table-row">
                {columns.map(({ label, component: ColumnComponent }, i) => {
                  return <ColumnComponent key={label + i} {...experiment} />;
                })}
              </tr>
            ))
          ) : (
            <tr data-testid="directory-table-row">
              <td
                colSpan={columns.length}
                data-testid="directory-table-no-experiments"
              >
                No experiments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export const DirectoryLiveTable: React.FC<DirectoryTableProps> = (props) => (
  <DirectoryTable
    {...props}
    columns={[
      { label: props.title, component: DirectoryColumnTitle },
      { label: "Owner", component: DirectoryColumnOwner },
      { label: "Feature", component: DirectoryColumnFeature },
      {
        label: "Enrolling",
        component: (experiment) => (
          <td data-testid="directory-table-cell">
            {getProposedEnrollmentRange(experiment)}
          </td>
        ),
      },
      {
        label: "Ending",
        component: (experiment) => (
          <td data-testid="directory-table-cell">
            {humanDate(experiment.computedEndDate!)}
          </td>
        ),
      },
      {
        label: "Monitoring",
        component: ({ monitoringDashboardUrl }) => (
          <td data-testid="directory-table-cell">
            {monitoringDashboardUrl && (
              <LinkExternal
                href={monitoringDashboardUrl!}
                data-testid="link-monitoring-dashboard"
              >
                Grafana
              </LinkExternal>
            )}
          </td>
        ),
      },
      {
        label: "Results",
        component: ({ slug }) => (
          <td data-testid="directory-table-cell">
            <Link to={`${slug}/results`} data-sb-kind="pages/Results">
              Results
            </Link>
          </td>
        ),
      },
    ]}
  />
);

export const DirectoryCompleteTable: React.FC<DirectoryTableProps> = (
  props,
) => (
  <DirectoryTable
    {...props}
    columns={[
      { label: props.title, component: DirectoryColumnTitle },
      { label: "Owner", component: DirectoryColumnOwner },
      { label: "Feature", component: DirectoryColumnFeature },
      {
        label: "Started",
        component: ({ startDate: d }) => (
          <td data-testid="directory-table-cell">{d && humanDate(d)}</td>
        ),
      },
      {
        label: "Ended",
        component: ({ computedEndDate: d }) => (
          <td data-testid="directory-table-cell">{d && humanDate(d)}</td>
        ),
      },
      {
        label: "Results",
        component: ({ slug }) => (
          <td data-testid="directory-table-cell">
            <Link to={`${slug}/results`} data-sb-kind="pages/Results">
              Results
            </Link>
          </td>
        ),
      },
    ]}
  />
);

export const DirectoryDraftsTable: React.FC<DirectoryTableProps> = (props) => (
  <DirectoryTable
    {...props}
    columns={[
      {
        label: props.title,
        component: (experiment) => (
          <DirectoryColumnTitle
            {...experiment}
            subPath="/edit"
            sbLink="pages/EditOverview"
          />
        ),
      },
      { label: "Owner", component: DirectoryColumnOwner },
      { label: "Feature", component: DirectoryColumnFeature },
    ]}
  />
);

export default DirectoryTable;
