/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MockedResponse } from "@apollo/client/testing";
import React from "react";
import PageEditOverview from ".";
import { RouterSlugProvider } from "../../lib/test-utils";

export const Subject = ({
  mocks = [],
}: {
  mocks?: MockedResponse<Record<string, any>>[];
}) => {
  return (
    <RouterSlugProvider {...{ mocks }}>
      <PageEditOverview />
    </RouterSlugProvider>
  );
};
