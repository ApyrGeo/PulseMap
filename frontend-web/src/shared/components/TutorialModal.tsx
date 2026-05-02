import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Stepper from './Stepper/Stepper';
import './TutorialModal.css';

const TUTORIAL_KEY = 'pulsemap_tutorial_seen';

const TutorialModal = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      setVisible(true);
    }
  }, []);

  const close = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
  };

  const steps = [
    { title: t('tutorial.step1Title'), description: t('tutorial.step1Desc') },
    { title: t('tutorial.step2Title'), description: t('tutorial.step2Desc') },
    { title: t('tutorial.step3Title'), description: t('tutorial.step3Desc') },
    { title: t('tutorial.step4Title'), description: t('tutorial.step4Desc') },
    { title: t('tutorial.step5Title'), description: t('tutorial.step5Desc') },
  ];

  if (!visible) return null;

  return (
    <div className="tutorial-overlay" onClick={close}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <Stepper
          steps={steps}
          onFinish={close}
          onSkip={close}
          finishLabel={t('tutorial.finish')}
          skipLabel={t('tutorial.skip')}
          nextLabel={t('tutorial.next')}
        />
      </div>
    </div>
  );
};

export default TutorialModal;
