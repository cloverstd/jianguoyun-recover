import { Descriptions, Modal, Steps } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import FilesRecover from './FilesRecover';
import RecoverFilter from './RecoverFilter';
import Scan from './Scan';

const { Step } = Steps;

const loadFromLocal = <V,>(key: string): undefined | V => {
  const value = localStorage.getItem(key);
  if (!value) {
    return undefined;
  }
  return JSON.parse(value);
};

const LoadFromLocalModal = ({
  update,
}: {
  update: (
    sndbox: I.Jianguoyun.Sandbox,
    events: I.Jianguoyun.Event[],
    recoverFiles: number,
    duration: number
  ) => void;
}) => {
  const [visible, setVisible] = useState(false);

  const [sndbox] = useState(loadFromLocal<I.Jianguoyun.Sandbox>('sndbox'));
  const [events] = useState(loadFromLocal<I.Jianguoyun.Event[]>('events'));

  useEffect(() => {
    if (sndbox && events) {
      setVisible(true);
    }
  }, [sndbox, events]);

  const resume = () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const events = loadFromLocal<I.Jianguoyun.Event[]>('events');
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const sndbox = loadFromLocal<I.Jianguoyun.Sandbox>('sndbox');
    if (events && sndbox) {
      update(
        sndbox,
        events,
        loadFromLocal<number>('recoverFiles') || 0,
        loadFromLocal<number>('duration') || 0
      );
      setVisible(false);
    }
  };
  return (
    <Modal
      visible={visible}
      title="发现当前有未完成的任务，是否要继续"
      okText="继续"
      cancelText="不要"
      onOk={resume}
      onCancel={() => setVisible(false)}
    >
      <Descriptions>
        <Descriptions.Item label="文件夹">
          {sndbox?.name || '我的坚果云'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default ({ sndboxes }: { sndboxes: I.Jianguoyun.Sandbox[] }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const [sndbox, setSndbox] = useState<I.Jianguoyun.Sandbox>();

  const [files, setFiles] = useState<I.Jianguoyun.Event[]>([]);

  const [duration, setDuration] = useState(0);
  const [recoverFiles, setRecoverFiles] = useState(0);

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
      <LoadFromLocalModal
        update={(s, e, r, d) => {
          setSndbox(s);
          setFiles(e);
          setDuration(d);
          setRecoverFiles(r);
          setCurrentStep(2);
        }}
      />
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
              onSubmit={({ opType, range, sndbox: v }) => {
                setCurrentOpType(opType);
                setCurrentRange(range);
                setSndbox(v);
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
            <FilesRecover
              events={files}
              sndbox={sndbox}
              recoverFilesCount={recoverFiles}
              durationInit={duration}
            />
          )}
        </div>
      )}
    </div>
  );
};
