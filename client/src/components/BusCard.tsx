import React from 'react';

interface Props {
	tripId: number;
}

const BusCard = (props: Props) => {
	return <div className="w-40 h-20">Trip: {props.tripId}</div>;
};

export default BusCard;
