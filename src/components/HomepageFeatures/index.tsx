import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>> | (() => null);
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '🤖 AI Agents',
    description: (
      <>
        Create intelligent AI agents with custom personalities, knowledge bases, and monetization options.
        Share with friends or make them public.
      </>
    ),
  },
  {
    title: '📹 Livestreaming',
    description: (
      <>
        Broadcast live video streams to your friends. Streams are automatically recorded
        and stored for later viewing.
      </>
    ),
  },
  {
    title: '💬 Decentralized Messaging',
    description: (
      <>
        Peer-to-peer messaging powered by Waku. No central server required.
        End-to-end encrypted communication.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={clsx('text--center', styles.featureCard)}>
        <div className={styles.featureIcon}>{title.split(' ')[0]}</div>
        <div className="padding-horiz--md">
          <Heading as="h3" className={styles.featureTitle}>{title.replace(/^[^\s]+\s/, '')}</Heading>
          <p className={styles.featureDescription}>{description}</p>
      </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
