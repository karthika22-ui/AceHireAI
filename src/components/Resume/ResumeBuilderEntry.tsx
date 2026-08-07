import React from 'react';
import { ResumeBuilderWizard } from './ResumeBuilderWizard';

interface ResumeBuilderEntryProps {
  onBackToSelection: () => void;
}

export const ResumeBuilderEntry: React.FC<ResumeBuilderEntryProps> = ({ onBackToSelection }) => {
  return <ResumeBuilderWizard onBackToSelection={onBackToSelection} />;
};

export default ResumeBuilderEntry;
