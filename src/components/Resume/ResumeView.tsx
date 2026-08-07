import React, { useState } from 'react';
import { ResumeSelectionScreen } from './ResumeSelectionScreen';
import { ATSAnalyzerView } from './ATSAnalyzerView';
import { ResumeBuilderEntry } from './ResumeBuilderEntry';

export type ResumeSubView = 'selection' | 'ats' | 'builder';

export const ResumeView: React.FC = () => {
  const [subView, setSubView] = useState<ResumeSubView>('selection');

  if (subView === 'ats') {
    return <ATSAnalyzerView onBackToSelection={() => setSubView('selection')} />;
  }

  if (subView === 'builder') {
    return <ResumeBuilderEntry onBackToSelection={() => setSubView('selection')} />;
  }

  return <ResumeSelectionScreen onSelectOption={(option) => setSubView(option)} />;
};

export default ResumeView;
