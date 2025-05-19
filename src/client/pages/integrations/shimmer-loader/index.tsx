const IntegrationsShimmerLoader = () => {
	return (
		<div className="quillbooking-payment-settings grid grid-cols-2 gap-5 w-full">
			<div className="animate-pulse">
				<div className="border rounded-lg p-6">
					<div className="flex items-center gap-4 mb-6">
						<div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
						<div>
							<div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
							<div className="h-4 w-64 bg-gray-200 rounded"></div>
						</div>
					</div>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
								<div className="w-12 h-12 bg-gray-200 rounded"></div>
								<div className="flex-1">
									<div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
									<div className="h-4 w-96 bg-gray-200 rounded"></div>
								</div>
								<div className="w-16 h-8 bg-gray-200 rounded"></div>
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="animate-pulse">
				<div className="border rounded-lg p-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
							<div className="h-4 w-64 bg-gray-200 rounded"></div>
						</div>
						<div className="w-16 h-8 bg-gray-200 rounded"></div>
					</div>
					<div className="space-y-4">
						{[1, 2].map((i) => (
							<div key={i} className="h-12 bg-gray-200 rounded"></div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default IntegrationsShimmerLoader;
