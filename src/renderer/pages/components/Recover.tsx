import { Steps } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import FilesRecover from './FilesRecover';
import RecoverFilter from './RecoverFilter';
import Scan from './Scan';

const { Step } = Steps;

export default ({ sndboxes }: { sndboxes: I.Jianguoyun.Sandbox[] }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const [sndbox, setSndbox] = useState<I.Jianguoyun.Sandbox>();

  const [files, setFiles] = useState<I.Jianguoyun.Event[]>([]);

  const [currentOpType, setCurrentOpType] = useState<I.Jianguoyun.OpType>();
  const [currentRange, setCurrentRange] =
    useState<[moment.Moment, moment.Moment]>();

  const [scaning, setScaning] = useState(false);

  useEffect(() => {
    if (currentStep === 1) {
      setScaning(true);
    }
  }, [currentStep]);

  return (
    <div style={{ width: '80%', margin: '0 auto', marginTop: '20px' }}>
      <Steps current={currentStep}>
        <Step title="筛选" />
        <Step title="扫描" />
        <Step title="恢复" />
      </Steps>
      {sndboxes.length && (
        <div>
          {currentStep === 0 && (
            <RecoverFilter
              sndboxes={sndboxes}
              onSubmit={({ opType, range, sndbox }) => {
                setCurrentOpType(opType);
                setCurrentRange(range);
                setSndbox(sndbox);
                setCurrentStep(1);
              }}
            />
          )}
          {currentStep === 1 && sndbox && (
            <Scan
              sndbox={sndbox}
              loading={scaning}
              opType={currentOpType}
              range={currentRange}
              onPrev={() => setCurrentStep(0)}
              onNext={(events) => {
                setFiles(events);
                setCurrentStep(2);
              }}
              onDone={() => {
                setScaning(false);
              }}
            />
          )}
          {currentStep === 2 && sndbox && (
            <FilesRecover events={files} sndbox={sndbox} />
          )}
        </div>
      )}
    </div>
  );
};
