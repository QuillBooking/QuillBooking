/**
 * Internal dependencies
 */
import AdvancedModulesCard from "./advanced-modules-card";
import PluginsCard from "./plugins-card";

const AdvancedModulesTab: React.FC = () => {
    return (
        <div className="quillbooking-modules-settings grid grid-cols-2 gap-5 w-full">
            <AdvancedModulesCard/>
            <PluginsCard/>
        </div>
    );
};

export default AdvancedModulesTab;