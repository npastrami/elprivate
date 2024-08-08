import React, { createContext, useState, FC } from "react";

import { JobData } from ".";

interface JobContextValue extends JobData {
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
}

export const JobContext = createContext<JobContextValue>({ setJobData: () => { } });

export const JobProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobData, setJobData] = useState<JobData>({ clientID: '', versionID: '' });

  return (
    <JobContext.Provider value={{
      ...jobData,
      setJobData
    }}>

      {children}
    </JobContext.Provider>
  )
}

export default JobProvider;